/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

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

  var remote = Utils.getNewConnectedRemote(rippleSourceAddr, rippleSourceSecret);

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

  return deferred.promise;
}

// TODO: this a bit more complicated - and do we need it?
function set_trust_by_email(userEmail, bankAdminEmail) {

}

exports.setTrust = setTrust;
exports.set_trust_by_email = set_trust_by_email;

Utils.eventEmitter.on('set_trust', function(data) {
  setTrust(data.rippleDestinationAddr, data.rippleSourceAddr, data.rippleSourceSecret);
});
