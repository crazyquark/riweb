/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RealBankAccount = require('./RealBankAccount.model');
var User = require('./../user/user.model');
var debug = require('debug')('RealBankAccountSocket');

function getRealBankAccountForEmail(email) {
  var promise = User.findByEmail(email).then(function(foundUser) {

    if (foundUser) {
      return RealBankAccount.findByIban(foundUser.iban).then(function(foundRealAccount) {
        if (foundRealAccount) {
            return { status: 'success', account: foundRealAccount};
        } else {
          debug('cannot find IBAN Account', foundUser.iban)
          return { status: 'error', message: 'IBAN bank account not found'};
        }
      });
    }
    else {
      debug('cannot find user for email ', email);
      return { status: 'error', message: 'user not found'};
    }
  });

  return promise;
}


exports.getRealBankAccountForEmail = getRealBankAccountForEmail;

exports.register = function(clientEventEmitter) {
};
