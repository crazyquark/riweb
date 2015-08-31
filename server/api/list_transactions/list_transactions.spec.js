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
      var stubs = TestingUtils.buildGenericSetup();
      aliceWallet = stubs.wallets.alice;
      bobWallet = stubs.wallets.bob;
      remote = stubs.remote;
      emitter = stubs.emitter;
      emitSpy = emitter.emitEvent;
      bank1 = stubs.banks.bankA;

      fromAliceToBobTx = TestingUtils.getNewPaymentTransaction(aliceWallet.address, bobWallet.address, 100);
      fromBobToAliceTx = TestingUtils.getNewPaymentTransaction(bobWallet.address, aliceWallet.address, 99);
      fromBank1ToAliceTx = TestingUtils.getNewPaymentTransaction(bank1.hotWallet.address, aliceWallet.address, 98);

      TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
        TestingUtils.restoreAll();
        emitSpy.restore();
    });

    it('should list transactions from Alice to Bob', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromAliceToBobTx] });

        var expectedHumanTransactions = [{
					source: 'alice@a.com',
					destination: 'bob@b.com',
					amount: 100 + '€',
                    orderRequestId: '',
					fee: 12}];

        ListTransactions.listTransactions(emitter, 'alice@a.com').then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);

            done();
        }).done(null, function (error) {
            done(error);
        });
    });

    it('should list transactions from Bob to Alice', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromBobToAliceTx] });

        var expectedHumanTransactions = [{
					source: 'bob@b.com',
					destination: 'alice@a.com',
					amount: 99 + '€',
                    orderRequestId: '',
					fee: 12}];

            ListTransactions.listTransactions(emitter, 'alice@a.com').then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('post:list_transactions',
                { status: 'success', transactions: expectedHumanTransactions });
          done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it('should list transactions from bank A to Alice', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromBank1ToAliceTx] });

        var expectedHumanTransactions = [{
					source: 'admin@a.com',
					destination: 'alice@a.com',
					amount: 98 + '€',
                    orderRequestId: '',
					fee: 12}];

            ListTransactions.listTransactions(emitter, 'alice@a.com').then(function(humanTransactions){

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
