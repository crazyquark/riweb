/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var create_wallet = require('./../create_wallet/create_wallet.socket');

// function get_ripple_info(ripple_address, info_function){
//   var deferred = Q.defer();
//   var options = {
//     account: ripple_address,
//     ledger: 'validated'
//   };
//   info_function(options, function(err, info) {
//     if(!err){
//       deferred.reject(info);
//     } else {
//       deferred.resolve(err);
//     }
//   });
//   return deferred.promise;
// }
//
// function remote_request_account_lines_old(ripple_address, remote){
//   Q.fcall(get_ripple_info(ripple_address, remote.requestAccountLines))
//     .then(function(ripple_info){
//     console.log('---------ripple_info');
//     console.log(ripple_info);
//     var account_info = ripple_info[0];
//     var account_lines = ripple_info[1];
//
//     var account = {
//       balance: account_info.account_data.Balance,
//       currencies: account_lines.lines
//     }
//     return account;
//   });
// }

function remote_request_account_lines(ripple_address, remote){
  var deferred = Q.defer();
  var options = {
    account: ripple_address,
    ledger: 'validated'
  };
  remote.requestAccountLines(options, function(err, info) {
    if(!err){
      deferred.resolve(info);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
}


function get_ripple_account_info(ripple_address) {
  var deferred = Q.defer();

  Utils.getNewConnectedRemote()
    .then(function(remote){
      remote_request_account_lines(ripple_address, remote).then(function(info){
        deferred.resolve(info);
      });
    }).catch(function(err){
      console.error(err);
      deferred.reject(err);
    });
  return deferred.promise;
}

function get_account_info(owner_email, socket) {
  return Wallet.findByOwnerEmail(owner_email).then(function(wallets) {
      console.log('get_account_info');
      console.log(wallets);
      console.log(wallets && wallets.length === 1);
      if (wallets && wallets.length === 1) { // There should be only one
        var wallet = wallets[0];

        console.log('get_ripple_account_info');
        get_ripple_account_info(wallet.publicKey).then(function(account) {
          console.log('emit.post:account_info');
          console.log(account);
          socket.emit('post:account_info', account);
        }).catch(function(err){
          console.error(err);
          deferred.reject(err);
        });
      } else {
        console.log('create_wallet.create_wallet_for_email');
        create_wallet.create_wallet_for_email(owner_email);
      }
  });
}


exports.get_ripple_account_info = get_ripple_account_info;
exports.get_account_info = get_account_info;

exports.register = function(socket) {
  socket.on('account_info', function(owner_email) {
    get_account_info(owner_email, socket);
  });
}
