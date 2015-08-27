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
var BankAccount = require('../bankaccount/bankaccount.model');

var TestingUtils = require('./../../../test/utils/testing_utils');

var ListTransactions = require('./list_transactions.socket');

var debug = require('debug')('TListTransactions');

describe('Test list_transactions', function() {
    var remote, emitSpy, aliceWallet, bobWallet, bank1, fromAliceToBobTx, fromBobToAliceTx,
      fromBank1ToAliceTx, emitter;

    beforeEach(function (done) {
        remote = TestingUtils.buildRemoteStub();
        sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remote));
        emitter = TestingUtils.buildNewClientEventEmitterSpy();
        emitSpy = emitter.emitEvent;

        aliceWallet = TestingUtils.getNonAdminMongooseWallet('alice@example.com', 'Alice');
        bobWallet = TestingUtils.getNonAdminMongooseWallet('bob@example.com', 'Bob');

        bank1 = {
            'email': 'bank1@example.com',
            'hotWallet': {
                'address': 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyThBank',
                'secret': 'NONADMINssphraseBank'
            }
        };

      sinon.stub(Wallet, 'findByOwnerEmail', TestingUtils.buildKeyValuePromiseFunction({
          'alice@example.com': aliceWallet,
          'bob@example.com': bobWallet
      }));

      sinon.stub(Wallet, 'findByRippleAddress', TestingUtils.buildArrayPropertyPromiseFunction([
          aliceWallet, bobWallet], 'address'));

      sinon.stub(BankAccount, 'findByRippleAddress', TestingUtils.buildArrayPropertyPromiseFunction([bank1], 'address'));

      fromAliceToBobTx = TestingUtils.getNewPaymentTransaction(aliceWallet.address, bobWallet.address, 100);
      fromBobToAliceTx = TestingUtils.getNewPaymentTransaction(bobWallet.address, aliceWallet.address, 99);
      fromBank1ToAliceTx = TestingUtils.getNewPaymentTransaction(bank1.address, aliceWallet.address, 98);

      TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
        TestingUtils.restoreAll();
        emitSpy.restore();
    });

    it('should list transactions from Alice to Bob', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromAliceToBobTx] });

        var expectedHumanTransactions = [{
					source: 'alice@example.com',
					destination: 'bob@example.com',
					amount: 100 + '€',
                    orderRequestId: '',
					fee: 12}];

        ListTransactions.listTransactions(emitter, 'alice@example.com').then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);

            done();
        }).done(null, function (error) {
            done(error);
        });
    });

    it('should list transactions from Bob to Alice', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromBobToAliceTx] });

        var expectedHumanTransactions = [{
					source: 'bob@example.com',
					destination: 'alice@example.com',
					amount: 99 + '€',
                    orderRequestId: '',
					fee: 12}];

            ListTransactions.listTransactions(emitter, 'alice@example.com').then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('post:list_transactions',
                { status: 'success', transactions: expectedHumanTransactions });
          done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it('should list transactions from bank1 to Alice', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromBank1ToAliceTx] });

        var expectedHumanTransactions = [{
					source: 'bank1@example.com',
					destination: 'alice@example.com',
					amount: 98 + '€',
                    orderRequestId: '',
					fee: 12}];

            ListTransactions.listTransactions(emitter, 'alice@example.com').then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('post:list_transactions',
                { status: 'success', transactions: expectedHumanTransactions });
          done();
        }).done(null, function (error) {
            done(error);
        });
    });

});
