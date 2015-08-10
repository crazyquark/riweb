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

function fundBanks(bank1, bank2) {
	var deferred = Q.defer();
	Utils.getNewConnectedRemote().then(function (remote) {
		debug('Fund the banks');
		CreateWallet.fundWallet(bank1, Utils.ROOT_RIPPLE_ACCOUNT, 1000).then(function () {
			debug('Funded bank1');
			CreateWallet.fundWallet(bank2, Utils.ROOT_RIPPLE_ACCOUNT, 1000).then(function () {
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
	CreateWallet.fundWallet(user1, bank1).then(function () {
		debug('fundUsers user1');
		CreateWallet.fundWallet(user2, bank2).then(function () {
			debug('fundUsers user2');
			deferred.resolve({ status: 'success' });
		})
	});

	return deferred.promise;
}

function setBankFlags(bank1, bank2) {
	var deferred = Q.defer();
	debug('setBankFlags');
	SetRootFlags.setRootFlags(bank1).then(function () {
		debug('set root flags bank1');
		SetRootFlags.setRootFlags(bank2).then(function () {
			debug('set root flags bank1');
			deferred.resolve({ status: 'success' });
		});
	});

	return deferred.promise;
}

function setBanksTrust(bank1, bank2, user1, user2) {
	var deferred = Q.defer();

	setBankFlags(bank1, bank2, user1, user2).then(function () {
		debug('set root flags for banks');
		SetTrust.setTrust(bank1.address, user1.address, user1.secret).then(function () {
			debug('set trust user1->bank1');
			SetTrust.setTrust(bank2.address, user2.address, user2.secret).then(function () {
				debug('set trust user2->bank2');
				SetTrust.setTrust(bank1.address, bank2.address, bank2.secret).then(function () {
					debug('set trust bank1->bank2');
					SetTrust.setTrust(bank2.address, bank1.address, bank1.secret).then(function () {
						deferred.resolve({ status: 'success' });
					});
				});
			});
		});
	});

	return deferred.promise;
}

function makeEurTransfer(senderWallet, recvWallet, issuer, amount) {
	var deferred = Q.defer();
	
	issuer = issuer || senderWallet.address;
	
	Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
		var transaction = remote.createTransaction('Payment', {
			account: senderWallet.address,
			destination: recvWallet.address,
			amount: amount + '/EUR/' + issuer,
		});

		transaction.submit(function (err, res) {
			if (err) {
				deferred.reject(err);
			}
			if (res) {
				deferred.resolve({ status: 'success', transaction: transaction });
			}

		});
	});
	return deferred.promise;
}

describe('ITest rippled', function () {
	this.timeout(90000);
	xit('Create this scenario on Ripple: user1 -> bank1 -> bank2 <- user2', function (done) {
		debug('Create 4 Ripple accounts');

		var user1 = ripple.Wallet.generate();
		var user2 = ripple.Wallet.generate();
		var bank1 = ripple.Wallet.generate();
		var bank2 = ripple.Wallet.generate();
		
		debug('user1, user2, bank1, bank2');
		debug(user1, user2, bank1, bank2);
		
		fundBanks(bank1, bank2).then(function () {
			debug('funded banks');
			fundUsers(bank1, bank2, user1, user2).then(function () {
				setBanksTrust(bank1, bank2, user1, user2).then(function () {
					debug('makeEurTransfers');
					makeEurTransfer(bank1, user1, 100).then(function () {
						debug('makeEurTransfer user1');
						makeEurTransfer(bank2, user2, 100).then(function () {
							debug('makeEurTransfer user2');
							makeEurTransfer(user1, user2, bank2.address, 10).then(function () {
								debug('makeEurTransfer user1, user2');
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