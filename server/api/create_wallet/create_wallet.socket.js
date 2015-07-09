/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Wallet = require('./../wallet/wallet.model');
var WalletGenerator = require('ripple-wallet').Generator;

function create_wallet() {
  var walletGenerator = new WalletGenerator();
  var wallet = walletGenerator.generate();
  return wallet;
}

exports.create_wallet = create_wallet;

exports.register = function(socket) {
  socket.on('create_wallet', function(data) {
    var ripple_wallet = create_wallet();
    var wallet = {
      ownerEmail: data.ownerEmail,
      publicKey: ripple_wallet.address,
      passphrase: ripple_wallet.secret,
    };
    Wallet.create(wallet, function(err, wallet) {
      if(!err) {
        socket.emit('post:create_wallet', null, wallet.publicKey);
      } else {
        socket.emit('post:create_wallet', 'error', null);
        console.error(err);
      }
    });

  });
}
