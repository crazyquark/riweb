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

    xit('should send 50 EURO from Alice to Bob', function (done) {
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
        sinon.mock(remote, 'setSecret');

        MakeTransfer.makeTransfer('alice@example.com', 'bob@example.com', amount).then(function () {
            expect(remote.createTransaction).to.have.calledWith('Payment', {
                account: alliceWallet.publicKey,
                destination: bobWallet.publicKey,
                amount: amount + '/EUR/' + TestingUtils.rootAccountAddress
            });
            expect(remote.setSecret).to.have.calledWith(alliceWallet.publicKey, alliceWallet.passphrase);

            expect(emitSpy).to.have.calledWith('make_transfer', {
                fromEmail: 'alice@example.com',
                toEmail: 'bob@example.com',
                amout: amount,
                status: 'success'
            });

            done();
        }).done(null, function (error) {
            done(error);
        });
    });

});