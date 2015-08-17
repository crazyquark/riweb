'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var RealBankAccountSchema = new Schema({
    name: String,
    iban: String,
    ballance: String
  });

module.exports = mongoose.model('RealBankAccount', RealBankAccountSchema);