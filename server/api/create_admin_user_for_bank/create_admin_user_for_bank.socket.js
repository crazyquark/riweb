/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var User = require('../user/user.model');

function createAdminUserForBank(adminUserInfo) {
    var deferred = Q.defer();

    User.create({
        provider: 'local',
        name: adminUserInfo.info,
        email: adminUserInfo.email,
        bank: adminUserInfo.bankId,
        role: 'admin',
    }).then(function (newUser) {
        deferred.resolve(newUser);
    });

    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function (socket) {

}

