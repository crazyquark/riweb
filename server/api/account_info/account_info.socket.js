/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var create_wallet = require('./../create_wallet/create_wallet.socket');

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
        get_ripple_account_info(wallet.publicKey).then(function(ripple_account_info) {
          var account_lines = {
            balance: ripple_account_info.lines.length > 0 ? ripple_account_info[0].Balance : 0
          };

          console.log('emit.post:account_info');;
          socket.emit('post:account_info', account_lines);
        }).catch(function(err){
          console.error(err);
          deferred.reject(err);
        });
      } else {
        console.log('No wallet yet for ' + owner_email);
      }
  });
}


exports.get_ripple_account_info = get_ripple_account_info;
exports.get_account_info = get_account_info;

exports.register = function(socket) {
  socket.on('account_info', function(owner_email) {
    get_account_info(owner_email, socket);
  });
};
