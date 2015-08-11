/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

var debug = require('debug')('SetTrust');

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
    var transaction = remote.createTransaction('TrustSet', {
      account: rippleSourceAddr,
      limit: limit + '/' + currency + '/' + rippleDestinationAddr
    });
  
    transaction.submit(function(err, res) {
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

exports.setTrustAll = setTrustAll;
exports.setTrust = setTrust;
exports.register = function() {
  Utils.getEventEmitter().on('set_trust', function(data) {
    setTrust(data.rippleDestinationAddr, data.rippleSourceAddr, data.rippleSourceSecret);
  });
};
