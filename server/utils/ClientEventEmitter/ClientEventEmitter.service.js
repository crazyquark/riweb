'use strict';

// ClientEventEmitter.js
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function ClientEventEmitter(socket) {
  EventEmitter.call(this);
  var emitter = this;
  
  emitter.onSocketEvent = socket.on;
  emitter.emitSocketEmit = socket.emit;
  emitter.onceSocketEvent = socket.once;
  emitter.emitAndRunOnceEvent = function(eventName, event, callback){
    emitter.once('post:' + eventName, callback);
    emitter.emit(eventName, event);
  };

  emitter.emitAndRunOnceSocket = function(eventName, event, callback){
    socket.once('post:' + eventName, callback);
    socket.emit(eventName, event);
  };

  emitter.forwardFromEventEmitterToSocket = function forwardFromEventEmitterToSocket(eventName) {
    emitter.on(eventName, function (event) {
      socket.emit(eventName, event);
    });
  }
  
}

util.inherits(ClientEventEmitter, EventEmitter);

module.exports = ClientEventEmitter;