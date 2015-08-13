'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var RealBankAccountSchema = new Schema({
    name: String,
    iban: String,
    ballance: String
  });

module.exports = mongoose.model('RealBankAccount', RealBankAccountSchema);