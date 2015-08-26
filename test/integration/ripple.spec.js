'use strict';

var app = require('../../server/app');
var config = require('../../server/config/environment');
var local = require('../../server/config/local.env');

var chai = require('chai');
var expect = chai.expect;

var ripple = require('ripple-lib');
var debug = require('debug')('ITRipple');
var Q = require('q');
var Utils = require('../../server/utils/utils');
var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket');
var SetRootFlags = require('../../server/api/set_root_flags/set_root_flags.socket');
var SetTrust = require('../../server/api/set_trust/set_trust.socket');
var MakeTransfer = require('../../server/api/make_transfer/make_transfer.socket');
var TestingUtils = require('../utils/testing_utils');


describe('ITest rippled', function () {
	this.timeout(90000);
	var emitter;
	
	beforeEach(function(){
		emitter = TestingUtils.buildNewClientEventEmitterSpy();
	});
	
	function fundBanks(bank1, bank2) {
		var deferred = Q.defer();
		Utils.getNewConnectedRemote().then(function (remote) {
			debug('Fund the banks');
			CreateWallet.fundWallet(emitter, bank1, Utils.ROOT_RIPPLE_ACCOUNT, 10000).then(function () {
				debug('Funded bank1');
				CreateWallet.fundWallet(emitter, bank2, Utils.ROOT_RIPPLE_ACCOUNT, 10000).then(function () {
					debug('Funded bank2');

					deferred.resolve({ status: 'success' });
				});
			});
		});

		return deferred.promise;
	}

	function fundUsers(bank1, bank2, user1, user2) {
		var deferred = Q.defer();
		debug('fundUsers');
		CreateWallet.fundWallet(emitter, user1, bank1, 100).then(function () {
			debug('fundUsers user1');
			CreateWallet.fundWallet(emitter, user2, bank2, 100).then(function () {
				debug('fundUsers user2');
				deferred.resolve({ status: 'success' });
			})
		});

		return deferred.promise;
	}
	it('Create this scenario on Ripple: user1 -> bank1 -> bank2 -> user2', function (done) {
		debug('Create 4 Ripple accounts');

		var user1 = ripple.Wallet.generate();
		var user2 = ripple.Wallet.generate();
		var bank1 = ripple.Wallet.generate();
		var bank2 = ripple.Wallet.generate();

		debug('user1 ', user1);
		debug('bank1 ', bank1);

		debug('user2 ', user2);
		debug('bank2 ', bank2);

		fundBanks(bank1, bank2).then(function () {
			debug('funded banks');
			fundUsers(bank1, bank2, user1, user2).then(function () {
				SetTrust.setBanksTrust(bank1, bank2, user1, user2).then(function () {
					debug('makeTransferWithRipple');
                    MakeTransfer.makeTransferWithRipple(bank1, user1, bank1.address, 100).then(function () {
						debug('makeTransferWithRipple user1');
						MakeTransfer.makeTransferWithRipple(bank2, user2, bank2.address, 100).then(function () {
							debug('makeTransferWithRipple user2');
							MakeTransfer.makeTransferWithRipple(user1, user2, bank2.address, 5, bank1.address).then(function () {
								debug('makeTransferWithRipple user1, user2');
								done();
							}).fail(function (err) {
								debug('error: ', err);
								done(err);
							})
						})
					})
				})
			});
		});
	});
});
