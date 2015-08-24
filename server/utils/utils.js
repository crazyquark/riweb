
var ripple = require('ripple-lib');
var Q = require('q');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var express = require('express');
var cookie = require('cookie');

var LoggedEmitterService = require('./LoggedEmitter/LoggedEmitter.service');

var debug = require('debug')('Utils');

var ROOT_RIPPLE_ACCOUNT = {
    address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    secret  : 'masterpassphrase'
};

var RIPPLED_WS_SERVER = 'ws://localhost:6006';

function getNewRemote(){
  var newRemote = new ripple.Remote({
        servers: [ RIPPLED_WS_SERVER ]
        //fee_cushion: 0.0
    });

  newRemote.on('disconect', function(){
    console.log('remote disconect');
  });

  newRemote.on('disconected', function(){
    console.log('remote disconected');
  });

  return newRemote;
}

function getNewConnectedRemote(rippleAddress, rippleSecret){
  debug('getNewConnectedRemote', rippleAddress, rippleSecret);
  var deferred = Q.defer();
  var remote = getNewRemote();

  if (rippleAddress && rippleSecret) {
    remote.setSecret(rippleAddress, rippleSecret);
  }

  remote.connect(function(err){
    debug('getNewConnectedRemote remote.connect err=', err);
    if(!err){
      deferred.resolve(remote);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
}

function getNewConnectedAdminRemote() {
  return getNewConnectedRemote(ROOT_RIPPLE_ACCOUNT.address, ROOT_RIPPLE_ACCOUNT.secret);
}

var token;

function onEvent(eventName, listenerFunction) {
    LoggedEmitterService.on(eventName, wrappedListenerFunction);

    function wrappedListenerFunction() {
        var eventObject = arguments[0];
        eventObject.token = token; 
        listenerFunction.call(null, eventObject);
    }

    return wrappedListenerFunction;
}

function emitEvent(eventName, event) {
    event.token = token;
    LoggedEmitterService.emit(eventName, event);
}

function setSocketId(theSocketId){
  // if(theSocketId === undefined){
  //   throw new Error("must set a socket id");
  // }
  // socketId = theSocketId;  
}

var sockets = [];

function getToken(socket){
  var cookies = cookie.parse(socket.handshake.headers.cookie);
  return cookies.token;
}

function putSocket(socket){
  var token = getToken(socket);
  sockets[token] = socket;
  debug('putSocket', socket.id, token);
}

function forwardFromEventEmitterToSocket(eventName, socket) {
    debug('forwardFromEventEmitterToSocket', socket.id);
    putSocket(socket);
    onEvent(eventName, function (event) {
        debug('onEvent', event.token, token, eventName, event);
        sockets[event.token].emit(eventName, event);
    });
}

function onSocketEvent(socket, eventName, listenerFunction){
  var token = getToken(socket);
  
  function wrappedListenerFunction() {
      var eventObject = arguments[0];
      eventObject.token = token;
      listenerFunction.call(null, eventObject);
  }
  
  socket.on(eventName, wrappedListenerFunction);

  return wrappedListenerFunction;
}

module.exports.onSocketEvent = onSocketEvent;
module.exports.putSocket = putSocket;
module.exports.emitEvent = emitEvent;
module.exports.onEvent = onEvent;
module.exports.setSocketId = setSocketId;
module.exports.getNewConnectedRemote = getNewConnectedRemote;
module.exports.getNewConnectedAdminRemote = getNewConnectedAdminRemote;
module.exports.ROOT_RIPPLE_ACCOUNT = ROOT_RIPPLE_ACCOUNT;
module.exports.forwardFromEventEmitterToSocket = forwardFromEventEmitterToSocket;