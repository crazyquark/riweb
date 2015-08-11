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
    var remote, emitSpy, aliceWallet, bobWallet, bank1, socketSpy, fromAliceToBobTx, fromBobToAliceTx, fromBank1ToAliceTx;

    beforeEach(function (done) {
        remote = TestingUtils.buildRemoteStub();
        sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remote));
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
        socketSpy = TestingUtils.buildSocketSpy();

        aliceWallet = TestingUtils.getNonAdminMongooseWallet('alice@example.com', 'Alice');
        bobWallet = TestingUtils.getNonAdminMongooseWallet('bob@example.com', 'Bob');
        
        bank1 = {
            'email': 'bank1@example.com',
            'hotWallet': {
                'address': 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyThBank',
                'secret': 'NONADMINssphraseBank'
            },
        };
        
        sinon.stub(Wallet, 'findByOwnerEmail', function (email) {
            if (email === 'alice@example.com') {
                return Q([aliceWallet]);
            } else if (email === 'bob@example.com') {
                return Q([bobWallet]);
            }
            return Q([]);
        });

        sinon.stub(Wallet, 'findByRippleAddress', function (address) {
            var thePromise = Q(null);
            if (address === aliceWallet.address) {
                thePromise = Q(aliceWallet);
            } else if (address === bobWallet.address) {
                thePromise = Q(bobWallet);
            }
            thePromise.rippleAddress = address;
            return thePromise;
        });

        sinon.stub(BankAccount, 'findByRippleAddress', function (address) {
            debug('BankAccount findByRippleAddress', address);
            var thePromise = Q(null);
            if ( address === bank1.address) {
                debug('BankAccount findOneQ returns ', bank1);
                thePromise = Q(bank1);
            }
            thePromise.rippleAddress = address;
            return thePromise;
        });


        fromAliceToBobTx = { tx: {
    			Account: aliceWallet.address,
    			Destination: bobWallet.address,
    			Fee: 12,
                date: '123456',
                TransactionType: 'Payment',
    			Amount:  { currency: 'EUR', issuer: 'ROOT', value: 100 }}};

        fromBobToAliceTx = { tx: {
    			Account: bobWallet.address,
    			Destination: aliceWallet.address,
    			Fee: 12,
                date: '123456',
                TransactionType: 'Payment',
    			Amount:  { currency: 'EUR', issuer: 'ROOT', value: 99 }}};

        fromBank1ToAliceTx = { tx: {
    			Account: bank1.address,
    			Destination: aliceWallet.address,
    			Fee: 12,
                date: '123457',
                TransactionType: 'Payment',
    			Amount:  { currency: 'EUR', issuer: 'ROOT', value: 98 }}};

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
					fee: 12}];

        ListTransactions.listTransactions('alice@example.com', socketSpy).then(function(humanTransactions){

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
					fee: 12}];

            ListTransactions.listTransactions('alice@example.com', socketSpy).then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);
            expect(socketSpy.emit).to.have.callCount(1);
            expect(socketSpy.emit).to.have.been.calledWith('post:list_transactions',
                { status: 'success', transactions: expectedHumanTransactions });
          done();
        }).done(null, function (error) {
            done(error);
        });
    });


    it.only('should list transactions from bank1 to Alice', function (done) {
        remote.requestAccountTransactions.yields(null, { transactions: [fromBank1ToAliceTx] });

        var expectedHumanTransactions = [{
					source: 'bank1@example.com',
					destination: 'alice@example.com',
					amount: 98 + '€',
					fee: 12}];

            ListTransactions.listTransactions('alice@example.com', socketSpy).then(function(humanTransactions){

            expect(humanTransactions.transactions).to.eql(expectedHumanTransactions);
            expect(socketSpy.emit).to.have.callCount(1);
            expect(socketSpy.emit).to.have.been.calledWith('post:list_transactions',
                { status: 'success', transactions: expectedHumanTransactions });
          done();
        }).done(null, function (error) {
            done(error);
        });
    });

});
