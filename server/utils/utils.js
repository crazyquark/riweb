
var ripple = require('ripple-lib');
var Q = require('q');

var LoggedEmitterService = require('./LoggedEmitter/LoggedEmitter.service');

var debug = require('debug')('EventEmitter');
var error = debug('app:error');

var ROOT_RIPPLE_ACCOUNT = {
    address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    secret  : 'masterpassphrase'
};

var RIPPLED_WS_SERVER = 'ws://localhost:6006';

function getNewRemote(){
    return new ripple.Remote({
        servers: [ RIPPLED_WS_SERVER ]
        //fee_cushion: 0.0
    });
}

function getNewConnectedRemote(rippleAddress, rippleSecret){
  var deferred = Q.defer();
  var remote = getNewRemote();

  if (rippleAddress && rippleSecret) {
    remote.setSecret(rippleAddress, rippleSecret);
  }

  remote.connect(function(err){
    if(!err){
      deferred.resolve(remote);
    } else {
      error(err);
      deferred.reject(err);
    }
  });
  return deferred.promise;
}

function getNewConnectedAdminRemote() {
  return getNewConnectedRemote(ROOT_RIPPLE_ACCOUNT.address, ROOT_RIPPLE_ACCOUNT.secret);
}

module.exports.getNewConnectedRemote = getNewConnectedRemote;
module.exports.getNewConnectedAdminRemote = getNewConnectedAdminRemote;
module.exports.ROOT_RIPPLE_ACCOUNT = ROOT_RIPPLE_ACCOUNT;
module.exports.getEventEmitter = function(){
    return LoggedEmitterService;
};
