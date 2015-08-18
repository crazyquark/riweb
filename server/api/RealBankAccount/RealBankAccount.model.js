'use strict';

var Q = require('q');

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RealBankAccountSchema = new Schema({
    name: String,
    iban: String,
    ballance: String
  });

RealBankAccountSchema.statics.findByIban = function(accountIban){
  return this.findOneQ({iban: accountIban});
};

RealBankAccountSchema.methods.canDeposit = function(depositAmount) {
  return (parseInt(this.ballance) >= parseInt(depositAmount));
};

RealBankAccountSchema.methods.deposit = function(depositAmount) {
  var newBalance = parseInt(this.ballance) - parseInt(depositAmount);
  
  var deferred = Q.defer();
  
  if (newBalance < 0) {
    deferred.resolve({status: 'error', message: 'insufficient funds'});
    return deferred.promise;
  }    
  
  this.ballance = newBalance;
  this.save(function(err) {
    if (err) deferred.resolve({status: 'error', message: err});
    else deferred.resolve({status: 'success'});
  });

  return deferred.promise;
};


RealBankAccountSchema.methods.withdraw = function(withdrawAmount) {
  var newBalance = parseInt(this.ballance) + parseInt(withdrawAmount);
  
  var deferred = Q.defer();
    
  this.ballance = newBalance;
  
  this.save(function(err) {
    if (err) deferred.resolve({status: 'error', message: err});
    else deferred.resolve({status: 'success'});
  });

  return deferred.promise;
};

module.exports = mongoose.model('RealBankAccount', RealBankAccountSchema);