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

module.exports = mongoose.model('Bankaccount', BankaccountSchema);
