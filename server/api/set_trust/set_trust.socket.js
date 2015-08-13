/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

var SetRootFlags = require('./../set_root_flags/set_root_flags.socket');

var debug = require('debug')('===========SetTrust');

/**
* Creates a trust line between 2 ripple accounts
* @param rippleDestinationAddr target trustline endpoint
* @param rippleSourceAddr source trustline endpoint
* @param rippleSourceSecret source address secret (used to create the trustline)
* @param limit the limit of the thrustline (defaults to 1000)
* @param currency the currency of the thrustline (defaults to 'EUR')
*/
function setTrust(rippleDestinationAddr, rippleSourceAddr, rippleSourceSecret, limit, currency) {
  limit = limit || 1000;
  currency = currency || 'EUR';

  var deferred = Q.defer();

  debug('setTrust: ', rippleDestinationAddr, rippleSourceAddr, rippleSourceSecret, limit, currency);

  Utils.getNewConnectedRemote(rippleSourceAddr, rippleSourceSecret).then(function(remote) {
    debug('getNewConnectedRemote', rippleSourceAddr, rippleSourceSecret);
    var transactionOptions = {
      account: rippleSourceAddr,
      limit: limit + '/' + currency + '/' + rippleDestinationAddr
      };
      var transaction = remote.createTransaction('TrustSet', transactionOptions);

    transaction.submit(function(err) {
      debug('transaction.submit', transactionOptions, err);
      if(!err) {
        deferred.resolve({status: 'success'}); // See no evil
      } else {
        deferred.reject({status: 'error', error: err});
      }
    });
  });

  return deferred.promise;
}

/**
* Creates a trust line between a ripple account and a list of ripple accounts
* @param rippleDestinationAddreses target trustlines endpoints
* @param rippleSourceAddr source trustline endpoint
* @param rippleSourceSecret source address secret (used to create the trustline)
* @param limit the limit of the thrustline (defaults to 1000)
* @param currency the currency of the thrustline (defaults to 'EUR')
*/
function setTrustAll(rippleDestinationAddreses, rippleSourceAddr, rippleSourceSecret, limit, currency) {
  var setTrustPromises = [];

  rippleDestinationAddreses.forEach(function(rippleDestinationAddr){
    setTrustPromises.push(setTrust(rippleDestinationAddr, rippleSourceAddr, rippleSourceSecret, limit, currency));
  });

  return Q.all(setTrustPromises);
}

function setBanksTrust(bank1, bank2, user1, user2) {
  var deferred = Q.defer();

  SetRootFlags.setBankFlags(bank1, bank2, user1, user2).then(function () {
    var user1SetTrustAll = setTrustAll([bank1.address/*, bank2.address*/], user1.address, user1.secret);
    var user2SetTrustAll = setTrustAll([/*bank1.address,*/ bank2.address], user2.address, user2.secret);
    var bank2SetTrust = setTrustAll([bank1.address], bank2.address, bank2.secret);
    var bank1SetTrust = setTrustAll([bank2.address], bank1.address, bank1.secret);

    Q.all(user1SetTrustAll, user2SetTrustAll, bank1SetTrust, bank2SetTrust).then(function(){
      deferred.resolve({ status: 'success' });
    });
  });

  return deferred.promise;
}

exports.setTrustAll = setTrustAll;
exports.setBanksTrust = setBanksTrust;
exports.setTrust = setTrust;
exports.register = function() {
  Utils.getEventEmitter().on('set_trust', function(data) {
    setTrust(data.rippleDestinationAddr, data.rippleSourceAddr, data.rippleSourceSecret);
  });
};
