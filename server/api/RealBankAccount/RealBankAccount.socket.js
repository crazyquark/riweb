/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RealBankAccount = require('./RealBankAccount.model');

exports.register = function(socket) {
  RealBankAccount.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  RealBankAccount.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('RealBankAccount:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('RealBankAccount:remove', doc);
}