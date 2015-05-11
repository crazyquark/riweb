'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WalletSchema = new Schema({
  userId: String,
  publicKey: String,
  passphrase: String,
  walletType: String
});

module.exports = mongoose.model('Wallet', WalletSchema);