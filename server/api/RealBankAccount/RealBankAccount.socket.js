/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var RealBankAccount = require('./RealBankAccount.model');
var User = require('./../user/user.model');

function getBankAccountForEmail(ownerEmail) {
  var promise = User.findByEmail(ownerEmail).then(function(foundUser) {
    
    if (foundUser) {
      return RealBankAccount.findByIban(foundUser.iban).then(function(foundRealAccount) {
        if (foundRealAccount) {
            return { status: 'success', account: foundRealAccount };
        } else {
          debug('cannot find IBAN Account', foundUser.iban)
          return { status: 'error', message: 'IBAN bank account not found' };
        }
      });
    }
    else {
      debug('cannot find user for email ', ownerEmail)
      return { status: 'error', message: 'user not found' };
    }
  });

  return promise;
}


exports.getBankAccountForEmail = getBankAccountForEmail;

exports.register = function(socket) {
  RealBankAccount.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  RealBankAccount.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('RealBankAccount:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('RealBankAccount:remove', doc);
}