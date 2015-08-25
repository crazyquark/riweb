'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;
var Q = require('q');

var WalletSchema = new Schema({
  ownerEmail: String,
  address: String,
  secret: String,
  timestamp: { type: Date, default: Date.now }
});

WalletSchema.statics.findByOwnerEmail = function (ownerEmail) {
  return this.findOneQ({ ownerEmail: ownerEmail });
};

WalletSchema.statics.findByRippleAddress = function (rippleAddress) {
  var promise = this.findOneQ({ address: rippleAddress });
  promise.rippleAddress = rippleAddress; // let's remember why we're here
  
  return promise;
};

module.exports = mongoose.model('Wallet', WalletSchema);
