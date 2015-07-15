'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Q = require('q');

var WalletSchema = new Schema({
  ownerEmail: String,
  publicKey: String,
  passphrase: String
});

WalletSchema.statics.findByOwnerEmail = function(ownerEmail){
  var deferred = Q.defer();

  this.find({ownerEmail: ownerEmail}, function (err, wallet) {
    if(err){
      deferred.reject(err);
    } else {
      deferred.resolve(wallet);
    }
  });
  return deferred.promise;
};

module.exports = mongoose.model('Wallet', WalletSchema);
