/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var OrderRequest = require('./order_request.model');

exports.register = function(socket) {
  OrderRequest.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  OrderRequest.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('order_request:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('order_request:remove', doc);
}