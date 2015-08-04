'use strict';

var app = require('../../server/app');
var config = require('../../server/config/environment');

var chai = require('chai');
var expect = chai.expect;

var TestingUtils = require('../utils/testing_utils');
var MakeTransfer = require('../../server/api/make_transfer/make_transfer.socket');
var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket')

describe('ITest transfers', function () {
	var socketSpy, user, bank, userWallet;

	beforeEach(function (done) {
		this.timeout(10000); // The Talented Mr. Ripple takes a long time to fund wallets
		socketSpy = TestingUtils.buildSocketSpy();
		MakeTransfer.register(socketSpy);

		TestingUtils.seedBankAndUser(function (newUser, userBank) {
			user = newUser;
			bank = userBank;
			CreateWallet.fundWallet(bank.hotWallet).then(function () {
				CreateWallet.createWalletForEmail(user.email).then(function (wallet) {
					userWallet = wallet;
					done();
				})
			});
		});
	});

	afterEach(function (done) {
		TestingUtils.restoreAll();
		TestingUtils.dropMongodbDatabase().then(function () {
			done();
		});
	});

	it('Transfer from admin to regular user', function (done) {
		this.timeout(10000);
		MakeTransfer.makeTransfer(bank.email, user.email).then(function (result) {
			expect(result.status).to.eql('success');
			done();
		}, function (err) {
			done(err);
		});
	});
});
