'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;
var Q = require('q');
var RealBankAccountRequest = require('../RealBankAccountRequest/RealBankAccountRequest.model');

var RealBankAccountSchema = new Schema({
  name: String,
  iban: String,
  balance: String
});

RealBankAccountSchema.statics.findByIban = function (accountIban) {
  return this.findOneQ({ iban: accountIban });
};

RealBankAccountSchema.methods.canDepositToRipple = function (depositAmount) {
  return (parseInt(this.balance) >= parseInt(depositAmount));
};

RealBankAccountSchema.methods.depositToRipple = function (depositAmount) {
  var newBalance = parseInt(this.balance) - parseInt(depositAmount);

  var request = {
    iban: this.iban,
    status: 'success',
    balance: this.balance,
    name: this.name,
    message: 'Deposit to Ripple ' + depositAmount + ' € from account ' + this.iban
  };

  var deferred = Q.defer();

  if (newBalance < 0) {
    deferred.resolve({ status: 'error', message: 'insufficient funds' });
    request.status = 'error';
    request.message = 'insufficient funds';

    RealBankAccountRequest.create(request);

    return deferred.promise;
  }

  this.balance = newBalance;
  this.save(function (err) {
    if (err) {
      deferred.resolve({ status: 'error', message: err });
      request.status = 'error';
      request.message = 'insufficient funds';
    }
    else {
      request.balance = newBalance;
      deferred.resolve({ status: 'success' });
    }

    RealBankAccountRequest.create(request);
  });



  return deferred.promise;
};


RealBankAccountSchema.methods.withdrawFromRipple = function (withdrawAmount) {
  var newBalance = parseInt(this.balance) + parseInt(withdrawAmount);
  this.balance = newBalance;

  var deferred = Q.defer();

  var request = {
    iban: this.iban,
    status: 'success',
    balance: this.balance,
    name: this.name,
    message: 'Withdraw from Ripple ' + withdrawAmount + ' € to account ' + this.iban
  };

  this.save(function (err) {
    if (err) {
      deferred.resolve({ status: 'error', message: err });
      request.status = 'error';
      request.message = err;
    }
    else {
      request.balance = newBalance;
      deferred.resolve({ status: 'success' });
    }

    RealBankAccountRequest.create(request);
  });

  return deferred.promise;
};

module.exports = mongoose.model('RealBankAccount', RealBankAccountSchema);
