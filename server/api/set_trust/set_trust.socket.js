/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

/**
* Creates a trst line between 2 ripple accounts
* @param rippleDestinationAddr target trustline endpoint
* @param rippleSourceAddr source trustline endpoint
* @param rippleSourceSecret source address secret (used to create the trustline)
*/
function set_trust(rippleDestinationAddr, rippleSourceAddr, rippleSourceSecret, limit, currency) {
  var currency = currency || 'EUR';
  var limit = limit || 1000;

  var deferred = Q.defer();

  var remote = Utils.getNewConnectedRemote(rippleSourceAddr, rippleSourceSecret);

  var transaction = remote.createTransaction('TrustSet', {
    account: rippleSourceAddr,
    limit: limit + '/' + currency + + '/' + rippleDestinationAddr;
  });

  transaction.on('reusbmitted', function()) {
    // mkay...
  }

  transaction.submit(function(err, res) {
    if(!err) {
      deferred.resolve(null); // See no evil
    } else {
      deferred.reject(err);
    }
  });

  return deffered.promise;
}

// TODO: this a bit more complicated - and do we need it?
function set_trust_by_email(userEmail, bankAdminEmail) {

}

exports.set_trust = set_trust;
exports.set_trust_by_email = set_trust_by_email;

exports.register = function(socket) {

}
