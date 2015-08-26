'use strict';

// ClientEventEmitter.js
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('ClientEventEmitter');

function ClientEventEmitter(socket) {
  EventEmitter.call(this);
  var emitter = this;

  emitter.onSocketEvent = function(eventName, callback) {
    debug('onSocketEvent', eventName, callback);
    socket.on(eventName, callback);
  };

  emitter.emitSocketEvent = function(eventName, event) {
    debug('emitSocketEvent', eventName, event);
    socket.emit(eventName, event);
  };

  emitter.onceSocketEvent = function(eventName, callback) {
    debug('onceSocketEvent', eventName, callback);
    socket.once(eventName, callback);
  };

  emitter.emitAndRunOnceEvent = function(eventName, event, callback){
    debug('emitAndRunOnceEvent', eventName, event, callback);
    emitter.once('post:' + eventName, callback);
    emitter.emit(eventName, event);
  };

  emitter.emitAndRunOnceSocket = function(eventName, event, callback){
    debug('emitAndRunOnceSocket', eventName, event, callback);
    socket.once('post:' + eventName, callback);
    socket.emit(eventName, event);
  };

  emitter.onEvent = function(eventName, callback) {
    debug('onEvent', eventName, callback);
    emitter.emit(eventName, callback);
  };

  emitter.emitEvent = function(eventName, event) {
    debug('emitEvent', eventName, event);
    emitter.emit(eventName, event);
  };

  emitter.forwardFromEventEmitterToSocket = function forwardFromEventEmitterToSocket(eventName) {
    debug('forwardFromEventEmitterToSocket', eventName);
    emitter.onEvent(eventName, function (event) {
      debug('emitter.on --> socket.emit', eventName, event);
      emitter.emitSocketEvent(eventName, event);
    });
  }
}

util.inherits(ClientEventEmitter, EventEmitter);

module.exports = ClientEventEmitter;
