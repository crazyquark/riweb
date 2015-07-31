'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var BankaccountSchema = new Schema({
  name: String,
  info: String,
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

module.exports = mongoose.model('Bankaccount', BankaccountSchema);
