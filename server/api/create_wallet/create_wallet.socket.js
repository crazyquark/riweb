/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');

var socket;

var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function fundWallet(wallet, amount) {
  var deferred = Q.defer();
  amount = amount || 60;

  
  var ripple_address = wallet.address;

  if (ripple_address === ROOT_RIPPLE_ACCOUNT.address) {
    Utils.getEventEmitter().emit('set_root_flags', {});
    deferred.resolve(wallet);
  } else {
    Utils.getNewConnectedAdminRemote().then(function(remote){
      var options = { account: ROOT_RIPPLE_ACCOUNT.address,
                      destination: ripple_address,
                      amount : amount * 1000000
                    };

      var transaction = remote.createTransaction('Payment', options);
      transaction.submit(function (err) {
          if (err) {
              console.log('Failed to make initial XRP transfer because: ' +
                            err);
              deferred.reject(err);
          } else {
              console.log('Successfully funded wallet ' + ripple_address +
                          ' with 60 XRP');
              deferred.resolve(wallet);
              Utils.getEventEmitter().emit('set_trust', {
                  rippleDestinationAddr: ROOT_RIPPLE_ACCOUNT.address,
                  rippleSourceAddr: wallet.address,
                  rippleSourceSecret: wallet.secret
              });
          }
        });
    });
  }

  return deferred.promise;
}

function saveWalletToDb(wallet) {
  return Wallet.createQ(wallet);
}

function createAdminWallet(){
    return Q(Utils.ROOT_RIPPLE_ACCOUNT);
}

function createNewWallet(){
    return Q.fcall(ripple.Wallet.generate);
}

function getCreateWallet(ownerEmail){
    if (ownerEmail === 'admin@admin.com') {
        return createAdminWallet;
    } else {
        return createNewWallet;
    }
}

function convertRippleToRiwebWallet(ownerEmail){
  var walletConverterFunction = function(rippleWallet) {
        return {
            ownerEmail: ownerEmail,
            address: rippleWallet.address,
            secret: rippleWallet.secret
        };
    };
    return walletConverterFunction;
}

function createWalletForEmail(ownerEmail) {
  
  return Wallet.findByOwnerEmail(ownerEmail).then(function(foundWallet){
    if(!foundWallet){
      var createWallet = getCreateWallet(ownerEmail);
  
      var promise = createWallet()
          .then(convertRippleToRiwebWallet(ownerEmail))
          .then(saveWalletToDb)
          .then(fundWallet);
  
      return promise;
    } else {
      return Q(foundWallet);
    }
  }).then(function(foundWallet){
    socket.emit('post:create_wallet', foundWallet.address);
  });
}

exports.createWalletForEmail = createWalletForEmail;
exports.fundWallet = fundWallet;

exports.register = function(newSocket) {
  socket = newSocket;
  socket.on('create_wallet', function(data) {
      createWalletForEmail(data.ownerEmail);
  });
};
