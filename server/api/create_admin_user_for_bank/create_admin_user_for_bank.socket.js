/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var User = require('../user/user.model');
var Utils = require('../../utils/utils');

var debug = require('debug')('CreateAdminUserForBank');

var socket;

function createAdminUserForBank(adminUserInfo) {
    debug('createAdminUserForBank', adminUserInfo);
    var deferred = Q.defer();

    User.createQ({
        provider: 'local',
        name: adminUserInfo.info,
        email: adminUserInfo.email,
        bank: adminUserInfo.bankId,
        password: adminUserInfo.password,
        role: 'admin',
    }).then(function (newUser) {
        debug('createAdminUserForBank newUser ', newUser);

        var newUserStripped = { email: newUser.email, name: newUser.name };

        Utils.getEventEmitter().emit('post:create_admin_user_for_bank', { status: 'success', user:  newUserStripped});
        socket.emit('post:create_admin_user_for_bank', { status: 'success', user: newUserStripped });
        deferred.resolve(newUser);
    }, function (err) {
        debug('createAdminUserForBank error ', err);
        Utils.getEventEmitter().emit('post:create_admin_user_for_bank', { status: 'error', error: err });
        socket.emit('post:create_admin_user_for_bank', { status: 'error', error: err });
        deferred.reject(err);
    });

    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function (newSocket) {
    socket = newSocket;

    Utils.getEventEmitter().on('create_admin_user_for_bank', function (adminUserInfo) {
        createAdminUserForBank(adminUserInfo);
    });
};
