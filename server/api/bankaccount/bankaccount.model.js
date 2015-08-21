'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var BankaccountSchema = new Schema({
  name: String,
  info: String,
  email: String,
  coldWallet: {
    address: String
  },
  hotWallet: {
    address: String,
    secret: String
  },
  active: Boolean
});

BankaccountSchema.statics.findById = function(bankId){
  return this.findOneQ({_id: bankId});
};

BankaccountSchema.statics.findByRippleAddress = function(rippleAddress){
  var promise = this.findOneQ({'hotWallet.address' : rippleAddress});
  promise.rippleAddress = rippleAddress; // let's remember why we're here
  return promise;
};


module.exports = mongoose.model('Bankaccount', BankaccountSchema);
