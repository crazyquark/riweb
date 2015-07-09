/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Wallet = require('./../wallet/wallet.model');
var ripple = require('ripple-lib');

var Remote = ripple.Remote;
var remote = new Remote({
    // see the API Reference for available options
    servers: [ 'ws://localhost:6006' ]
});

function create_wallet() {
  var wallet = ripple.Wallet.generate();

  return wallet;
}

function fund_wallet(wallet, amount) {
  var amount = amount || 60;

  remote.setSecret(wallet.address, wallet.secret);

  var options = { account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
                  destination: wallet.address,
                  amount = amount * 1000000
                };
  var transaction = remote.createTransaction('Payment', options);
  transaction.submit(function (err, res) {
      if (err) {
          console.log('Failed to make initial XRP transfer because: ' + err.message);
      }
      if (res) {
        console.log('Successfully funded wallet ' + wallet.addres + ' with 60 XRP');
      }
  });
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
