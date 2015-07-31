/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var CreateAdminUserForBank = require('./create_admin_user_for_bank.model');

exports.register = function(socket) {
  CreateAdminUserForBank.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  CreateAdminUserForBank.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('create_admin_user_for_bank:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('create_admin_user_for_bank:remove', doc);
}