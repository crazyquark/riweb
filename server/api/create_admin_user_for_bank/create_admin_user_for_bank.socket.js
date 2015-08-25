/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var User = require('../user/user.model');
var Utils = require('../../utils/utils');

var debug = require('debug')('CreateAdminUserForBank');

var socket;

var emitter;

function createAdminUserForBank(adminUserInfo, clientEventEmitter) {
    debug('createAdminUserForBank', adminUserInfo);
    var deferred = Q.defer();

    User.createQ({
        provider: 'local',
        name: adminUserInfo.info,
        email: adminUserInfo.email,
        bank: adminUserInfo.bankId,
        password: adminUserInfo.password,
        role: 'admin'
    }).then(function (newUser) {
        debug('createAdminUserForBank newUser ', newUser);

        var newUserStripped = { email: newUser.email, name: newUser.name };

        clientEventEmitter.emit('post:create_admin_user_for_bank', { status: 'success', user:  newUserStripped});
        deferred.resolve(newUser);
    }, function (err) {
        debug('createAdminUserForBank error ', err);
        clientEventEmitter.emit('post:create_admin_user_for_bank', { status: 'error', error: err });
        deferred.reject(err);
    });

    return deferred.promise;
}

exports.createAdminUserForBank = createAdminUserForBank;

exports.register = function(newSocket, clientEventEmitter) {
    socket = newSocket;
    emitter = clientEventEmitter;

    clientEventEmitter.forwardFromEventEmitterToSocket('post:create_admin_user_for_bank', socket);

    clientEventEmitter.on('create_admin_user_for_bank', function (adminUserInfo) {
        createAdminUserForBank(adminUserInfo, clientEventEmitter);
    });

};
