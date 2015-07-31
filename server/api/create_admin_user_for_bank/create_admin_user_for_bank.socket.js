/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var User = require('../user/user.model');

function createAdminUserForBank(adminUserInfo) {
    var deferred = Q.defer();

    User.createQ({
        provider: 'local',
        name: adminUserInfo.info,
        email: adminUserInfo.email,
        bank: adminUserInfo.bankId,
        password: adminUserInfo.password,
        role: 'admin',
    }).then(function (newUser) {
        deferred.resolve(newUser);
    }, function(err) {
        deferred.resolve(null);
    });

    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function (socket) {

}

