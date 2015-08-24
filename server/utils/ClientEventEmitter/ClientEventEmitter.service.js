'use strict';

// ClientEventEmitter.js
var util = require('util');
var EventEmitter = require('events').EventEmitter;

function ClientEventEmitter(socket) {
  EventEmitter.call(this);
  this.socket = socket;
  this.onSocketEvent = socket.on;
  this.emitSocketEmit = socket.emit;

  this.forwardFromEventEmitterToSocket = function forwardFromEventEmitterToSocket(eventName) {
    this.on(eventName, function (event) {
      this.socket.emit(eventName, event);
    });
  }

}

util.inherits(ClientEventEmitter, EventEmitter);

module.exports = ClientEventEmitter;