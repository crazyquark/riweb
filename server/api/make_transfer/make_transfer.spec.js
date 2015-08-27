'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var expect = chai.expect;
var Q = require('q');
var RippleError = require('ripple-lib').RippleError;
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');
var User = require('./../user/user.model');
var Bankaccount = require('./../bankaccount/bankaccount.model');

var TestingUtils = require('./../../../test/utils/testing_utils');
var MakeTransfer = require('./make_transfer.socket');

var debug = require('debug')('TMakeTransfer');

describe('Test make_transfer', function () {

    var remote, emitSpy, aliceWallet, bobWallet, emitter;
    var bank1, bankWithNoWallet, nonAdminUser, nonAdminUserWithNoBank;

    beforeEach(function (done) {
        remote = TestingUtils.buildRemoteStub();
        sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remote));

        emitter = TestingUtils.buildNewClientEventEmitterSpy();

        emitSpy = emitter.emitEvent;
        aliceWallet = TestingUtils.getNonAdminMongooseWallet('alice@example.com', 'Alice');
        bobWallet = TestingUtils.getNonAdminMongooseWallet('bob@example.com', 'Bob');

        sinon.stub(Wallet, 'findByOwnerEmail', TestingUtils.buildKeyValuePromiseFunction({
          'alice@example.com': aliceWallet,
          'bob@example.com': bobWallet
        }));

        bank1 = TestingUtils.getMongooseBankAccount('_bank1', 'Test bank #1', TestingUtils.getNonAdminMongooseWallet('dumy@nothing.com', '_BANK1'));
        bankWithNoWallet = TestingUtils.getMongooseBankAccount('_bank1', 'Test bank #1', TestingUtils.getBadMongooseWallet('dumy@nothing.com'));
        nonAdminUser = TestingUtils.getNonAdminMongooseUser('Alice', 'alice@example.com', bank1._id);
        nonAdminUserWithNoBank = TestingUtils.getNonAdminMongooseUser('NoBank', 'no_bank@example.com', '#_no_id#');

        TestingUtils.buildUserFindEmailStub(User, nonAdminUser);
        TestingUtils.buildBankaccountFindById(Bankaccount, [bank1]);

        sinon.mock(remote, 'createTransaction');

        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
        TestingUtils.restoreAll();
        emitSpy.restore();

        User.findByEmail.restore();
        Bankaccount.findById.restore();
    });


    it('should send 50 EURO from Alice to Bob', function (done) {
        var amount = 50;

        MakeTransfer.makeTransfer(emitter, 'alice@example.com', 'bob@example.com', amount).then(function () {
            expect(remote.createTransaction).to.have.been.calledWith('Payment', {
                account: aliceWallet.address,
                destination: bobWallet.address,
                amount: amount + '/EUR/' + bank1.hotWallet.address
            });

            expect(Utils.getNewConnectedRemote).to.have.been.calledWith(aliceWallet.address, aliceWallet.secret);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: 50,
                issuer: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh_BANK1',
                status: 'success'}
            );

            done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it('should not send to unexisting address', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');

        MakeTransfer.makeTransfer(emitter, 'alice@example.com', 'charlie@example.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'charlie@example.com',
                amount: amount,
                issuer: undefined,
                status: 'error',
                message: 'missing account'
            });

            done();
        }).done(null, function (error) {
            done(error);
        });
    });

    it('should send to upstream ripple error', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');

        var rippleError;
        try {
            rippleError = new RippleError();
        } catch(e) { }

        remote._stub_transaction.submit.yields(rippleError, {});

        MakeTransfer.makeTransfer(emitter, 'alice@example.com', 'bob@example.com', amount).fail(function (result) {
            expect(remote.createTransaction).to.have.callCount(1);
            expect(Utils.getNewConnectedRemote).to.have.callCount(1);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: amount,
                issuer: bank1.hotWallet.address,
                message: 'Ripple error',
                // message: 'Ripple error. Cannot transfer from alice@example.com to bob@example.com 50 €!',
                status: 'ripple error'
            });

            done();
        }).done(null, function (error) {
          done(error);
        });
    });


    it('should not send from user without an issuer (bank)', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');
        User.findByEmail.restore();
        TestingUtils.buildUserFindEmailStub(User, nonAdminUserWithNoBank);


        MakeTransfer.makeTransfer(emitter, 'alice@example.com', 'bob@example.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: amount,
                issuer: undefined,
                status: 'error',
                message: 'issuing bank not resolved'
            });

            done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it('should not send from user with an issuer (bank) with invalid wallet', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');
        Bankaccount.findById.restore();
        TestingUtils.buildBankaccountFindById(Bankaccount, [bankWithNoWallet]);


        MakeTransfer.makeTransfer(emitter, 'alice@example.com', 'bob@example.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: amount,
                issuer: undefined,
                status: 'error',
                message: 'issuing bank not resolved'
            });

            done();
        }).done(null, function (error) {
            done(error);
        });
    });
});
