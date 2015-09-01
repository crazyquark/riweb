/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RealBankAccount = require('./RealBankAccount.model');
var RealBankAccountRequest = require('../RealBankAccountRequest/RealBankAccountRequest.model');

var User = require('./../user/user.model');
var debug = require('debug')('RealBankAccountSocket');

function getRealBankAccountForEmail(email) {
  var promise = User.findByEmail(email).then(function(foundUser) {

    if (foundUser) {
      return RealBankAccount.findByIban(foundUser.iban).then(function(foundRealAccount) {
        var request = {
            email: email,
            iban: foundUser.iban,
            status: 'ok',
            message: 'Found user',
        };
        if (foundRealAccount) {
            request.status = 'success';
            request.message = 'Found IBAN from user ' + foundRealAccount._id;
            request.balance = foundRealAccount.balance;
            request.name = foundRealAccount.name;
            RealBankAccountRequest.create(request);
            return { status: request.status, account: foundRealAccount};
        } else {
            request.status = 'error';
            request.message = 'IBAN bank account not found';
            RealBankAccountRequest.create(request);
            debug('Cannot find IBAN Account', foundUser.iban)
            return { status: request.status, message: request.message};
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
