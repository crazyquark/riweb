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

// TODO Move this
var ROOT_RIPPLE_ACCOUNT = {
  address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  secret  : 'masterpassphrase'
};

function create_wallet(callback) {
  // Wait for randomness to have been added.
  // The entropy of the random generator is increased
  // by random data received from a rippled
  // TODO: This is event is never received?
  // See: https://github.com/ripple/ripple-lib/blob/develop/docs/GUIDES.md
  //remote.connect(function(err, res) {
  //     if (!err) {
  //       console.log('Remote connected');
  //       remote.once('random', function(err, info) {
           var wallet = ripple.Wallet.generate();
           callback(wallet);
  //       });
  //     } else {
  //       console.warn('Creating Ripple Address in offline mode');
  //       var wallet = ripple.Wallet.generate();
  //       callback(wallet);
  //     }
  //    });
}

function fund_wallet(ripple_address, amount) {
  var amount = amount || 60;

  remote.setSecret(ROOT_RIPPLE_ACCOUNT.address , ROOT_RIPPLE_ACCOUNT.secret);

  var options = { account: ROOT_RIPPLE_ACCOUNT.address,
                  destination: ripple_address,
                  amount : amount * 1000000
                };
  remote.connect(function(err, res) {
    if (!err) {
        console.log('Remote connected');
        var transaction = remote.createTransaction('Payment', options);
        transaction.submit(function (err, res) {
            if (err) {
                console.log('Failed to make initial XRP transfer because: ' +
                              err);
            }
            if (res) {
              console.log('Successfully funded wallet ' + ripple_address +
                          ' with 60 XRP');
            }
          });
    } else {
      console.error('Remote not connected');
    }
  });
}

exports.create_wallet = create_wallet;
exports.fund_wallet = fund_wallet;

exports.register = function(socket) {
  socket.on('create_wallet', function(data) {
      create_wallet(function(ripple_wallet) {
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

      fund_wallet(ripple_wallet.address);
    });
  });
}
