
var ripple = require('ripple-lib');
var Q = require('q');

var ROOT_RIPPLE_ACCOUNT = {
    address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    secret  : 'masterpassphrase'
};

var RIPPLED_WS_SERVER = 'ws://localhost:6006'

function getNewRemote(){
    return new ripple.Remote({
        servers: [ RIPPLED_WS_SERVER ]
    });
}

function getNewConnectedRemote(rippleAddress, rippleSecret){
  var deferred = Q.defer();
  var remote = getNewRemote();

  if (rippleAddress && rippleSecret) {
    remote.setSecret(rippleAddress, rippleSecret);
  }

  remote.connect(function(err, res){
    if(!err){
      deferred.resolve(remote);
    } else {
      console.error(err);
      deferred.reject(err);
    }
  })
  return deferred.promise;
}

function getNewAdminRemote() {
  var remote = getNewRemote();
  remote.setSecret(ROOT_RIPPLE_ACCOUNT.address, ROOT_RIPPLE_ACCOUNT.secret);
  return remote;
}

module.exports.getNewRemote = getNewRemote;
module.exports.getNewConnectedRemote = getNewConnectedRemote;
module.exports.getNewAdminRemote = getNewAdminRemote;
module.exports.ROOT_RIPPLE_ACCOUNT = ROOT_RIPPLE_ACCOUNT;
