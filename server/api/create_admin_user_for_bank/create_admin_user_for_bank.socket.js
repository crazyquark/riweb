/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var User = require('../user/user.model');
var Utils = require('../../utils/utils');

var socket;

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
        Utils.getEventEmitter().emit('post:create_admin_user_for_bank', { status: 'success', user: newUser });
        socket.emit('post:create_admin_user_for_bank', { status: 'success', user: newUser });
    }, function (err) {
        deferred.reject(err);
        Utils.getEventEmitter().emit('post:create_admin_user_for_bank', { status: 'error', error: err });
        socket.emit('post:create_admin_user_for_bank', { status: 'error', error: err });
    });

    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function (newSocket) {
    socket = newSocket;

    socket.on('create_admin_user_for_bank', function (adminUserInfo) {
        createAdminUserForBank(adminUserInfo);
    });

    Utils.getEventEmitter().on('create_admin_user_for_bank', function (adminUserInfo) {
        createAdminUserForBank(adminUserInfo);
    });
}

