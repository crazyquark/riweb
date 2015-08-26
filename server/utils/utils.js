
var ripple = require('ripple-lib');
var Q = require('q');

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

function onEvent(eventName, listenerFunction) {
    LoggedEmitterService.once(eventName, wrappedListenerFunction);

    function wrappedListenerFunction() {
        var eventObject = arguments[0];
        listenerFunction.call(null, eventObject);
    }

    return wrappedListenerFunction;
}

function emitEvent(eventName, event) {
    LoggedEmitterService.emit(eventName, event);
}

var sockets = [];

function putSocket(socket){
  sockets[socket.id] = socket;
}

//deprecated?
function forwardFromEventEmitterToSocket(eventName, socket) {
    onEvent(eventName, function (event) {
        socket.emit(eventName, event);
    });
}

module.exports.putSocket = putSocket;
module.exports.emitEvent = emitEvent;
module.exports.onEvent = onEvent;
module.exports.getNewConnectedRemote = getNewConnectedRemote;
module.exports.getNewConnectedAdminRemote = getNewConnectedAdminRemote;
module.exports.ROOT_RIPPLE_ACCOUNT = ROOT_RIPPLE_ACCOUNT;
module.exports.forwardFromEventEmitterToSocket = forwardFromEventEmitterToSocket;
