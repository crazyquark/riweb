'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var expect = chai.expect;
var Q = require('q');
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

var TestingUtils = require('./../../../test/utils/testing_utils');

var MakeTransfer = require('./make_transfer.socket');

describe('Test make_transfer', function () {

    var remote, emitSpy, aliceWallet, bobWallet;
    beforeEach(function () {
        remote = TestingUtils.buildRemoteStub();
        Utils.getNewConnectedRemote = sinon.stub().returns(Q(remote));
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
        aliceWallet = TestingUtils.getNonAdminMongooseWallet('alice@example.com', 'Alice');
        bobWallet = TestingUtils.getNonAdminMongooseWallet('bob@example.com', 'Bob');
        sinon.stub(Wallet, 'findByOwnerEmail', function (email) {
            if (email === 'alice@example.com') {
                return Q([aliceWallet]);
            } else if (email === 'bob@example.com') {
                return Q([bobWallet]);
            }
            return Q([]);
        });
        sinon.mock(remote, 'createTransaction');
    });

    afterEach(function () {
        emitSpy.restore();
        TestingUtils.restoreWalletSpy();
    });
    afterEach(function () {
        TestingUtils.dropMongodbDatabase();
    });

    it('should send 50 EURO from Alice to Bob', function (done) {
        var amount = 50;

        MakeTransfer.makeTransfer('alice@example.com', 'bob@example.com', amount).then(function () {
            expect(remote.createTransaction).to.have.been.calledWith('Payment', {
                account: aliceWallet.address,
                destination: bobWallet.address,
                amount: amount + '/EUR/' + Utils.ROOT_RIPPLE_ACCOUNT.address
            });

            expect(Utils.getNewConnectedRemote).to.have.been.calledWith(aliceWallet.address, aliceWallet.secret);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: amount,
                status: 'success'
            });

            done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it('should not send to unexisting address', function (done) {
        var amount = 50;

        sinon.mock(remote, 'createTransaction');

        MakeTransfer.makeTransfer('alice@example.com', 'charlie@example.com', amount).then(function () {
            expect(remote.createTransaction).to.have.callCount(0);
            expect(Utils.getNewConnectedRemote).to.have.callCount(0);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'charlie@example.com',
                amount: amount,
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

        var rippleError = 'ripple error';

        remote._stub_transaction.submit.yields(rippleError, {});

        MakeTransfer.makeTransfer('alice@example.com', 'bob@example.com', amount).done(function (error) {
            expect(remote.createTransaction).to.have.callCount(1);
            expect(Utils.getNewConnectedRemote).to.have.callCount(1);

            expect(emitSpy).to.have.been.calledWith('post:make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amount: amount,
                message: 'Ripple error',
                status: 'ripple error'
            });

            done();
        });
    });

});
