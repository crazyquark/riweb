'use strict';

// ClientEventEmitter.js
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('ClientEventEmitter');

function ClientEventEmitter(socket) {
  EventEmitter.call(this);
  var emitter = this;

  emitter.onSocketEvent = function(eventName, callback) {
    debug('onSocketEvent', eventName);
    socket.on(eventName, callback);
  };

  emitter.emitSocketEvent = function(eventName, event) {
    debug('emitSocketEvent', eventName, event);
    socket.emit(eventName, event);
  };

  emitter.onceSocketEvent = function(eventName, callback) {
    debug('onceSocketEvent', eventName);
    waitFor(socket, eventName, callback);
  };

  emitter.emitAndRunOnceEvent = function(eventName, event, callback){
    debug('emitAndRunOnceEvent', eventName, event);
    waitFor(emitter, 'post:' + eventName, callback);
    emitter.emit(eventName, event);
  };

  emitter.emitAndRunOnceSocket = function(eventName, event, callback){
    debug('emitAndRunOnceSocket', eventName, event);
    waitFor(socket, 'post:' + eventName, callback);
    socket.emit(eventName, event);
  };

  emitter.onEvent = function(eventName, callback) {
    debug('onEvent', eventName);
    emitter.on(eventName, callback);
  };

  emitter.onceEvent = function(eventName, callback) {
    debug('onceEvent', eventName);
    waitFor(emitter, eventName, callback);
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

function waitFor(emitter, event, callback, timeout) {
  timeout = timeout || 5000;
  var called = false, handler, timer;

  handler = function() {
    called = true;
    clearTimeout(timer);
    callback.apply(this, arguments);
  };

  timer = setTimeout(function() {
    emitter.removeListener(handler);
    if (! called) {
      debug('Callback WAS NOT CALLED!!', callback);
      return callback("TIMEOUT");
    }
  }, timeout);

  emitter.once(event, handler);
}

util.inherits(ClientEventEmitter, EventEmitter);

module.exports = ClientEventEmitter;
