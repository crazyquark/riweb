/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Utils = require('./../../utils/utils');
var debug = require('debug')('SetRootFlags');

function setRootFlags(account) {
    var deferred = Q.defer();

	Utils.getNewConnectedRemote(account.address, account.secret).then(function(remote) {
        var transaction = remote.createTransaction('AccountSet', {
            account: account.address,
            set: 'DefaultRipple'
        });
        transaction.lastLedger(remote.getLedgerSequence() + 10); // Wait at most 10 ledger sequences
        
        transaction.submit(function(err){
            if (err) {
                debug(err);
             	deferred.reject(err);
            } else {
     	        deferred.resolve({status: 'success'});
            }
        });
    });

	return deferred.promise;
}

function setBankFlags(bank1, bank2) {
  var deferred = Q.defer();
  debug('setBankFlags');
  setRootFlags(bank1).then(function () {
    debug('set root flags bank1');
    setRootFlags(bank2).then(function () {
      debug('set root flags bank1');
      deferred.resolve({ status: 'success' });
    });
  });

  return deferred.promise;
}

exports.setBankFlags = setBankFlags;
exports.setRootFlags = setRootFlags;
exports.register = function() {
	Utils.getEventEmitter().on('set_root_flags', function(data) {
		setRootFlags(data.account);
	})
};
