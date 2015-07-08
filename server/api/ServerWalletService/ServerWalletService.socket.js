/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ServerWalletService = require('./ServerWalletService.model');

exports.register = function(socket) {
  ServerWalletService.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  ServerWalletService.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('ServerWalletService:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('ServerWalletService:remove', doc);
}