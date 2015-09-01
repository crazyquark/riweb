/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RealBankAccountRequest = require('./RealBankAccountRequest.model');

exports.register = function(socket) {
  RealBankAccountRequest.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  RealBankAccountRequest.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('RealBankAccountRequest:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('RealBankAccountRequest:remove', doc);
}