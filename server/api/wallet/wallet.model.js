'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;
var Q = require('q');

var WalletSchema = new Schema({
  ownerEmail: String,
  address: String,
  secret: String
});

WalletSchema.statics.findByOwnerEmail = function(ownerEmail){
  return this.findOneQ({ownerEmail: ownerEmail});
};

module.exports = mongoose.model('Wallet', WalletSchema);
