'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RealBankAccountRequestSchema = new Schema({
  email: String,
  name: String,
  iban: String,
  balance: String,
  status: String,
  message: String,
  timestamp: { type : Date, default: Date.now }
});

module.exports = mongoose.model('RealBankAccountRequest', RealBankAccountRequestSchema);