/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Wallet = require('./../wallet/wallet.model');
var ripple = require('ripple-lib');
var Q = require('q');

var socket;

var Remote = ripple.Remote;

// TODO Move this to config
var ROOT_RIPPLE_ACCOUNT = {
  address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  secret  : 'masterpassphrase'
};

// TODO Move this to config
var RIPPLED_WS_SERVER = 'ws://localhost:6006'

function create_wallet(callback) {
  // TODO: This is event is never received?
  var wallet = ripple.Wallet.generate();
  callback(wallet);
}

function fund_wallet(wallet, socket, callback, amount) {
  amount = amount || 60;

  var remote = new Remote({
      // see the API Reference for available options
      servers: [ RIPPLED_WS_SERVER ]
  });

  remote.setSecret(ROOT_RIPPLE_ACCOUNT.address , ROOT_RIPPLE_ACCOUNT.secret);

  var ripple_address = wallet.publicKey;
  var options = { account: ROOT_RIPPLE_ACCOUNT.address,
                  destination: ripple_address,
                  amount : amount * 1000000
                };
  remote.connect(function(err) {
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
              if (callback && socket) {
                callback(wallet, socket);
              }
            }
          });
    } else {
      console.error('Remote not connected');
    }
  });
}

function save_wallet_to_db(wallet, socket) {
  Wallet.create(wallet, function(err, wallet) {
    if(!err) {
      socket.emit('post:create_wallet', null, wallet.publicKey);
    } else {
      socket.emit('post:create_wallet', 'error', null);
      console.error(err);
    }
  });
}

function create_wallet_for_email(owner_email) {
    var deferred = Q.defer();

    var callback = function (ripple_wallet) {
        var wallet = {
            ownerEmail: owner_email,
            publicKey: ripple_wallet.address,
            passphrase: ripple_wallet.secret
        };

        if (owner_email === 'admin@admin.com') {
            wallet.publicKey = ROOT_RIPPLE_ACCOUNT.address;
            wallet.passphrase = ROOT_RIPPLE_ACCOUNT.secret;
        }

        fund_wallet(wallet, socket, save_wallet_to_db);

        deferred.resolve(wallet);
    };

    create_wallet(callback);
    return deferred.promise;
}

exports.create_wallet_for_email = create_wallet_for_email;
exports.create_wallet = create_wallet;
exports.fund_wallet = fund_wallet;

exports.register = function(newSocket) {
  console.log('myregister');
  socket = newSocket;
  socket.on('create_wallet', function(data) {
      create_wallet_for_email(data.ownerEmail);
  });
};
