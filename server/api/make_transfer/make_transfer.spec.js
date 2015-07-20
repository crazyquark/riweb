'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var expect = chai.expect;
var Q = require('q');
var ripple = require('ripple-lib');
var Amount = require('ripple-lib').Amount;
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

var TestingUtils = require('./../../../test/utils/testing_utils');

var MakeTransfer = require('./make_transfer.socket');

describe('Test make_transfer', function() {

    var remote, emitSpy;
    beforeEach(function () {
        remote = TestingUtils.buildRemoteStub();
        Utils.getNewConnectedRemote = sinon.stub().returns(Q.resolve(remote));
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
    });

    afterEach(function () {
        emitSpy.restore();
    });

    it('should send 50 EURO from Alice to Bob', function (done) {
        var alliceWallet = TestingUtils.getNonAdminMongooseWallet('alice@example.com', 'Alice');
        var bobWallet = TestingUtils.getNonAdminMongooseWallet('bob@example.com', 'Bob');

        sinon.stub(Wallet, 'findByOwnerEmail', function (email) {
            if (email === 'alice@example.com') {
                return Q.resolve(alliceWallet);
            } else {
                return Q.resolve(bobWallet);
            }
        });

        var amount = 50;

        sinon.mock(remote, 'createTransaction');

        MakeTransfer.makeTransfer('alice@example.com', 'bob@example.com', amount).then(function () {
            expect(remote.createTransaction).to.have.calledWith('Payment', {
                account: alliceWallet.publicKey,
                destination: bobWallet.publicKey,
                amount: Amount.from_human(amount + 'EUR')
            });
            expect(Utils.getNewConnectedRemote).to.have.calledWith(alliceWallet.publicKey, alliceWallet.passphrase);

            expect(emitSpy).to.have.calledWith('make_transfer:success', {
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

});
