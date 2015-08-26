'use strict';

var app = require('../../server/app');
var config = require('../../server/config/environment');

var chai = require('chai');
var expect = chai.expect;

var TestingUtils = require('../utils/testing_utils');

var MakeTransfer = require('../../server/api/make_transfer/make_transfer.socket');
var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket')
var SetTrust = require('../../server/api/set_trust/set_trust.socket');
var Utils = require('../../server/utils/utils');

var debug = require('debug')('=======TMakeTransfer');

describe('ITest transfers', function () {
	var socketSpy, emitter, user, bank, userWallet;

	beforeEach(function (done) {
		this.timeout(50000); // The Talented Mr. Ripple takes a long time to fund wallets
		socketSpy = TestingUtils.buildSocketSpy();
		emitter = TestingUtils.buildNewClientEventEmitterSpy(socketSpy);

		MakeTransfer.register(socketSpy, emitter);

		TestingUtils.dropMongodbDatabase().then(function () {
			TestingUtils.seedBankAndUser(emitter, function (newUser, userBank) {
				user = newUser;
				bank = userBank;
				CreateWallet.fundWallet(emitter, bank.hotWallet, Utils.ROOT_RIPPLE_ACCOUNT).then(function () {
					CreateWallet.createWalletForEmail(emitter, user.email).then(function (wallet) {
						userWallet = wallet;
						SetTrust.setTrust(userBank.hotWallet.address, userWallet.address, userWallet.secret, 1000, 'EUR').then(function () {
							done();
						}).done(null, function (error) { done(error); });
					}).done(null, function (error) { done(error); });
				}).done(null, function (error) { done(error); });
			});
		}).done(null, function (error) { done(error); });
	});

	afterEach(function () {
		TestingUtils.restoreAll();
	});

	it('Transfer from admin to regular user', function (done) {
		this.timeout(10000);
		MakeTransfer.makeTransfer(emitter, bank.email, user.email, 10).then(function (result) {
			expect(result.status).to.eql('success');
			done();
		}, function (err) {
			done(err);
		});
	});
});
