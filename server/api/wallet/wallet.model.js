'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WalletSchema = new Schema({
  ownerEmail: String,
  publicKey: String,
  passphrase: String,
  currency: String
});

module.exports = mongoose.model('Wallet', WalletSchema);