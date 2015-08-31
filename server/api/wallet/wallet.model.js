'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;
var Q = require('q');

var WalletSchema = new Schema({
  email: String,
  address: String,
  secret: String,
  timestamp: { type: Date, default: Date.now }
});

WalletSchema.statics.findByEmail = function (email) {
  return this.findOneQ({ email: email });
};

WalletSchema.statics.findByRippleAddress = function (rippleAddress) {
  var promise = this.findOneQ({ address: rippleAddress });
  promise.rippleAddress = rippleAddress; // let's remember why we're here

  return promise;
};

module.exports = mongoose.model('Wallet', WalletSchema);
