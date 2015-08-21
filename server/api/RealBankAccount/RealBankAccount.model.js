'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;
var Q = require('q');

var RealBankAccountSchema = new Schema({
    name: String,
    iban: String,
    balance: String
  });

RealBankAccountSchema.statics.findByIban = function(accountIban){
  return this.findOneQ({iban: accountIban});
};

RealBankAccountSchema.methods.canDeposit = function(depositAmount) {
  return (parseInt(this.balance) >= parseInt(depositAmount));
};

RealBankAccountSchema.methods.deposit = function(depositAmount) {
  var newBalance = parseInt(this.balance) - parseInt(depositAmount);
  
  var deferred = Q.defer();
  
  if (newBalance < 0) {
    deferred.resolve({status: 'error', message: 'insufficient funds'});
    return deferred.promise;
  }    
  
  this.balance = newBalance;
  this.save(function(err) {
    if (err) deferred.resolve({status: 'error', message: err});
    else deferred.resolve({status: 'success'});
  });

  return deferred.promise;
};


RealBankAccountSchema.methods.withdraw = function(withdrawAmount) {
  var newBalance = parseInt(this.balance) + parseInt(withdrawAmount);
  
  var deferred = Q.defer();
    
  this.balance = newBalance;
  
  this.save(function(err) {
    if (err) deferred.resolve({status: 'error', message: err});
    else deferred.resolve({status: 'success'});
  });

  return deferred.promise;
};

module.exports = mongoose.model('RealBankAccount', RealBankAccountSchema);