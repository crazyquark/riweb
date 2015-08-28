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

    var remote, emitSpy, aliceWallet, alanWallet, emitter;
    var bank1, bankWithNoWallet, nonAdminUser, nonAdminUserWithNoBank;

    beforeEach(function (done) {
        var stubs = TestingUtils.buildGenericSetup();
        aliceWallet = stubs.wallets.alice;
        alanWallet = stubs.wallets.alan;
        bank1 = stubs.banks.bankA;
        remote = stubs.remote;

        emitter = stubs.emitter;
        emitSpy = emitter.emitEvent;

        bankWithNoWallet = stubs.banks.bankC;

        nonAdminUser = stubs.users.alice;
        nonAdminUserWithNoBank = stubs.users.johndoe;

        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
        TestingUtils.restoreAll();
    });


    it('should send 50 EURO from Alice to Alan', function (done) {
        var amount = 50;

        MakeTransfer.makeTransfer(emitter, 'alice@a.com', 'alan@a.com', amount).then(function () {
            expect(remote.createTransaction).to.have.been.calledWith('Payment', {
                account: aliceWallet.address,
                destination: alanWallet.address,
                amount: amount + '/EUR/' + bank1.hotWallet.address
            });

            expect(Utils.getNewConnectedRemote).to.have.been.calledWith(aliceWallet.address, aliceWallet.secret);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@a.com',
                toEmail: 'alan@a.com',
                amount: 50,
                issuer: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh_BANK1',
                status: 'success'}
            );

            done();
        }).done(null, function (error) {
            debug(error);
            done(error);
        });
    });


    it('should not send to unexisting address', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');

        MakeTransfer.makeTransfer(emitter, 'alice@a.com', 'charlie@example.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@a.com',
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

        MakeTransfer.makeTransfer(emitter, 'alice@a.com', 'alan@a.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(1);
            expect(Utils.getNewConnectedRemote).to.have.callCount(1);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@a.com',
                toEmail: 'alan@a.com',
                amount: amount,
                issuer: bank1.hotWallet.address,
                message: 'Ripple error',
                // message: 'Ripple error. Cannot transfer from alice@a.com to bob@b.com 50 €!',
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

        MakeTransfer.makeTransfer(emitter, 'alice@a.com', 'alan@a.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@a.com',
                toEmail: 'alan@a.com',
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


        MakeTransfer.makeTransfer(emitter, 'alice@a.com', 'bob@b.com', amount).fail(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@a.com',
                toEmail: 'bob@b.com',
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
