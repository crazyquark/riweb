/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Bankaccount = require('./bankaccount.model');

exports.register = function(socket) {
  Bankaccount.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Bankaccount.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('bankaccount:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('bankaccount:remove', doc);
}