/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Wallet = require('./../wallet/wallet.model');

function get_account_info(owner_email, socket) {
  Wallet.find({ownerEmail: owner_email}, function(err, wallets) {
      if (wallets && wallets.length == 1) { // There should be only one

      }
      else {

      }
  });

}

exports.get_account_info = get_account_info;

exports.register = function(socket) {
  socket.on('account_info', function(owner_email) {

  });
}
