'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var WalletSchema = new Schema({
  ownerEmail: String,
  publicKey: String,
  passphrase: String
});

WalletSchema.statics.delete_this_function = function(args){
//    console.log('delete_this_function');
//    console.log(args);
};

module.exports = mongoose.model('Wallet', WalletSchema);
