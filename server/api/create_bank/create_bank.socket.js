/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var CreateBank = require('./create_bank.model');

exports.register = function(socket) {
  CreateBank.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  CreateBank.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('create_bank:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('create_bank:remove', doc);
}