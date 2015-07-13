/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../core/utils');

var socket;

var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function fund_wallet(wallet, socket, callback, amount) {
  amount = amount || 60;

  var remote = Utils.getNewRemote();

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

function create_admin_wallet(){
    return Q.resolve(Utils.ROOT_RIPPLE_ACCOUNT);
}

function create_new_wallet(){
    return Q.fcall(ripple.Wallet.generate);
}

function get_create_wallet(owner_email){
    if (owner_email === 'admin@admin.com') {
        return create_admin_wallet;
    } else {
        return create_new_wallet;
    }
}

function create_wallet_for_email(owner_email) {
    var deferred = Q.defer();
    var create_wallet = get_create_wallet(owner_email);

    create_wallet()
        .then(convert_ripple_to_riweb_wallet)
        .then(fund_wallet_and_save_to_db);


    function convert_ripple_to_riweb_wallet(ripple_wallet) {
        return {
            ownerEmail: owner_email,
            publicKey: ripple_wallet.address,
            passphrase: ripple_wallet.secret
        };
    }

    function fund_wallet_and_save_to_db(riweb_wallet) {
        fund_wallet(riweb_wallet, socket, save_wallet_to_db);
        deferred.resolve(riweb_wallet);
    }

    return deferred.promise;
}

exports.create_wallet_for_email = create_wallet_for_email;
exports.fund_wallet = fund_wallet;

exports.register = function(newSocket) {
  socket = newSocket;
  socket.on('create_wallet', function(data) {
      create_wallet_for_email(data.ownerEmail);
  });
};
