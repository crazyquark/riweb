/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Utils = require('./../../utils/utils');

function setRootFlags() {
    var deferred = Q.defer();
	
	Utils.getNewConnectedAdminRemote().then(function(remote) {
        var transaction = remote.createTransaction('AccountSet', {
            account: Utils.ROOT_RIPPLE_ACCOUNT.address,
            set: 'DefaultRipple'
        });

        transaction.submit(function(err){
            if (err) {
                console.error(err);
             	deferred.reject(err);
            } else {
     	        deferred.resolve({status: 'success'});
            }
        });
    });

	return deferred.promise;
}

exports.setRootFlags = setRootFlags;
exports.register = function() {
	Utils.getEventEmitter().on('set_root_flags', function() {
		setRootFlags();
	})  
}

