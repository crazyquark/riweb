/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var Wallet = require('./../wallet/wallet.model');

function get_ripple_account_info(ripple_address, callback) {
  var remote = Utils.getNewRemote();

  var options = {
    account: ripple_address,
    ledger: 'validated'
  };

  remote.requestAccountInfo(options, function(err, info) {
      var request = remote.requestAccountInfo(options, function(err, info) {
          if (!err) {
            callback(info);
          }
        });
  });
}

function get_account_info(owner_email, socket) {
  Wallet.find({ownerEmail: owner_email}, function(err, wallets) {
      if (wallets && wallets.length === 1) { // There should be only one
        var wallet = wallets[0];

        get_ripple_account_info(wallet.publicKey, function(err, account_info) {
            var account = {
              balance: account_info.Balance
            }
        });
      }
      else {

      }
  });

}



exports.get_account_info = get_account_info;

exports.register = function(socket) {
  socket.on('account_info', function(owner_email) {
    get_account_info(owner_email, socket);
  });
}
