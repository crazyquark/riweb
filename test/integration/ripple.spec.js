'use strict';

var app    = require('../../server/app');
var config = require('../../server/config/environment');

var chai   = require('chai');
var expect = chai.expect;

var ripple = require('ripple-lib');
var debug  = require('debug')('ITRipple');
var Q 	   = require('q');
var Utils 		 = require('../../server/utils/utils');
var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket');
var SetRootFlags = require('../../server/api/set_root_flags/set_root_flags.socket');

function fundBanks(bank1, bank2) {
	var deferred = Q.defer();
	Utils.getNewConnectedRemote().then(function (remote) {
		debug('Fund the banks');
		CreateWallet.fundWallet(bank1, Utils.ROOT_RIPPLE_ACCOUNT, 1000).then(function () {
			debug('Funded bank1');
			CreateWallet.fundWallet(bank2, Utils.ROOT_RIPPLE_ACCOUNT).then(function () {
				debug('Funded bank2');
				
				deferred.resolve();
			});
		});
	});
	
	return deferred.promise;
}

function setBankFlags(bank1, bank2) {
	
}

describe('ITest rippled', function () {
	it('Create this scenario on Ripple: user1 -> bank -> bank2 <- user2', function () {
		debug('Create 4 Ripple accounts');

		var user1 = ripple.Wallet.generate();
		var user2 = ripple.Wallet.generate();
		var bank1 = ripple.Wallet.generate();
		var bank2 = ripple.Wallet.generate();

		fundBanks(bank1, bank2).then(function(){
			
		});
	});
});