/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var create_wallet = require('./../create_wallet/create_wallet.socket');

function get_ripple_info(ripple_address, info_function){
  var deferred = Q.defer();
  var options = {
    account: ripple_address,
    ledger: 'validated'
  };
  info_function(options, function(err, info) {
    if(!err){
      deferred.resolve(info);
    } else {
      deferred.resolve(err);
    }
  });
  return deferred.promise;
}

function get_ripple_account_info(ripple_address, callback) {
  var deferred = Q.defer();

  Utils.getNewConnectedRemote()
    .then(function(remote){
      Q.all([
        get_ripple_info(ripple_address, remote.requestAccountInfo),
        get_ripple_info(ripple_address, remote.requestAccountLines)
      ]).then(function(ripple_info){
        var account_info = ripple_info[0];
        var account_lines = ripple_info[1];

        var account = {
          balance: account_info.account_data.Balance,
          currencies: account_lines.lines
        }
        deferred.resolve(account);
      })
    })
  return deferred.promise;
}

function get_account_info(owner_email, socket) {
  Wallet.find({ownerEmail: owner_email}, function(err, wallets) {
      console.log('Wallet.find ' + owner_email);
      console.log(wallets);
      if(err){ console.error(err);}
      if (wallets && wallets.length === 1) { // There should be only one
        var wallet = wallets[0];

        get_ripple_account_info(wallet.publicKey).then(function(account) {
          console.log('emit.post:account_info');
          console.log(account);
          socket.emit('post:account_info', account);
        });
      } else {
        create_wallet.create_wallet_for_email(owner_email);
      }
  });

}


exports.get_ripple_account_info = get_ripple_account_info;
exports.get_account_info = get_account_info;

exports.register = function(socket) {
  socket.on('account_info', function(owner_email) {
    console.log('on.account_info');
    console.log(owner_email);
    get_account_info(owner_email, socket);
  });
}
