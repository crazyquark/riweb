/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

var SetRootFlags = require('./../set_root_flags/set_root_flags.socket');
var BankAccount = require('../bankaccount/bankaccount.model');

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

  Utils.getNewConnectedRemote(rippleSourceAddr, rippleSourceSecret).then(function (remote) {
    debug('getNewConnectedRemote', rippleSourceAddr, rippleSourceSecret);
    var transactionOptions = {
      account: rippleSourceAddr,
      limit: limit + '/' + currency + '/' + rippleDestinationAddr
    };
    var transaction = remote.createTransaction('TrustSet', transactionOptions);

    transaction.submit(function (err) {
      debug('transaction.submit', transactionOptions, err);
      if (!err) {
        deferred.resolve({ status: 'success' }); // See no evil
      } else {
        deferred.reject({ status: 'error', error: err });
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

  rippleDestinationAddreses.forEach(function (rippleDestinationAddr) {
    setTrustPromises.push(setTrust(rippleDestinationAddr, rippleSourceAddr, rippleSourceSecret, limit, currency));
  });

  return Q.all(setTrustPromises);
}

/**
* Creates 2 trust lines between 2 accounts: wallet1 <---> wallet2
* @param wallet1 first wallet(address, secret) for trustlines
* @param wallet2 second wallet(address, source) for trustlines
* @param limit the limit of the trustlines (defaults to 1000)
* @param currency the currency of the trustlines (defaults to 'EUR')
*/
function setTrustBidir(wallet1, wallet2, limit, currency) {
  return setTrust(wallet1.address, wallet2.address, wallet2.secret, limit, currency).then(function () {
    return setTrust(wallet2.address, wallet1.address, wallet1.secret, limit, currency);
  });
}

/**
* Sets up the trust lines for this scenario: user1 - >bank1 <--> bank2 <- user
* @param bank1 a bank wallet
* @param bank2 a bank wallet
* @param user1 a user wallet
* @param user2 a user wallet
*/
function setBanksTrust(bank1, bank2, user1, user2) {
  var deferred = Q.defer();

  SetRootFlags.setBankFlags(bank1, bank2, user1, user2).then(function () {
    var user1SetTrustAll = setTrustAll([bank1.address/*, bank2.address*/], user1.address, user1.secret);
    var user2SetTrustAll = setTrustAll([/*bank1.address,*/ bank2.address], user2.address, user2.secret);
    var banksSetTrust = setTrustBidir(bank1, bank2);

    Q.all(user1SetTrustAll, user2SetTrustAll, banksSetTrust).then(function () {
      deferred.resolve({ status: 'success' });
    });
  });

  return deferred.promise;
}

/**
 * Sets up bidir trustlines between <code>bank</code> all other existing banks. Kinda iffy, I know.
 * @param bank the bank to set up trustlines for
 */
function setMutualBanksTrust(bank) {
  return BankAccount.findQ({ _id: { $not: { $eq: bank._id } } }).then(function (peerBanks) {
    var setTrustPromises = [];

    peerBanks.forEach(function (peerBank) {
      debug('setMutualBanksTrust:', peerBank);
      setTrustPromises.push(setTrustBidir(bank.hotWallet, peerBank.hotWallet));
    });

    return Q.all(setTrustPromises);
  });
}

exports.setTrustAll = setTrustAll;
exports.setBanksTrust = setBanksTrust;
exports.setTrust = setTrust;
exports.setTrustBidir = setTrustBidir;
exports.setMutualBanksTrust = setMutualBanksTrust;
exports.register = function () {
  Utils.getEventEmitter().on('set_trust', function (data) {
    setTrust(data.rippleDestinationAddr, data.rippleSourceAddr, data.rippleSourceSecret);
  });
};
