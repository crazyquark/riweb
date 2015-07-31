/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

function createAdminUserForBank(adminUserInfo) {
    var deferred = Q.defer();
    
    deferred.resolve(null);
        
    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function(socket) {

}

