/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var User = require('./../user/user.model');
var BankAccount = require('./../bankaccount/bankaccount.model');
var Utils = require('./../../utils/utils');

var debug = require('debug')('CreateWallet');

var socket;

//var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function fundWallet(wallet, sourceWallet, amount) {
  debug('fundWallet', wallet, amount);
  var deferred = Q.defer();

  amount = amount || 60;
  sourceWallet = sourceWallet || Utils.ROOT_RIPPLE_ACCOUNT; // By default use the root account for now  

  var ripple_address = wallet.address;

  //TODO: this needs to be moved to the BANK registration section
  if (ripple_address === sourceWallet.address) {
    Utils.getEventEmitter().emit('set_root_flags', {});
    deferred.resolve(wallet);
  } else {
      Utils.getNewConnectedRemote(sourceWallet.address, sourceWallet.secret).then(function(remote){
      var options = { account: sourceWallet.address,
                      destination: ripple_address,
                      amount : amount * 1000000
                    };

      var transaction = remote.createTransaction('Payment', options);
      debug('fundWallet remote.createTransaction', options);
      transaction.submit(function (err) {
          debug('fundWallet transaction.submit', err);
          if (err) {
              debug('Failed to make initial XRP transfer because: ' +
                            err);
              deferred.reject(err);
          } else {
              debug('Successfully funded wallet ' + ripple_address +
                          ' with 60 XRP');
              deferred.resolve(wallet);
              Utils.getEventEmitter().emit('set_trust', {
                  rippleDestinationAddr: sourceWallet.address,
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

function getBankForUser(ownerEmail) {
  var promise = User.findByEmail(ownerEmail).then(function(foundUser) {
    
    if (foundUser) {
      return BankAccount.findById(foundUser.bank).then(function(foundBank) {
        if (foundBank) {
          if (foundBank.hotWallet && foundBank.hotWallet.address && foundBank.hotWallet.secret) {
            return { status: 'success', bank: foundBank };
          } else {
            return { status: 'error', message: 'bank wallet not correct' };
          }
        } else {
          debug('cannot find bank ', foundUser.bankId)
          return { status: 'error', message: 'bank not found' };
        }
      });
    }
    else {
      debug('cannot find user for email ', ownerEmail)
      return { status: 'error', message: 'user not found' };
    }
  });

  return promise;
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

function createWalletForEmail(ownerEmail, role) {
  debug('createWalletForEmail', ownerEmail);

  var deferred = Q.defer();

  Wallet.findByOwnerEmail(ownerEmail).then(function(foundWallet){
    if (!foundWallet) {
      if (role === 'admin') {
        // Admin users have their wallet stored in the bankaccount doc, created apriori
        BankAccount.findOneQ({ email: ownerEmail }).then(function (bank) {
          return Q(bank.hotWallet);
        });
      }
      
      var bankWalletQ = getBankForUser(ownerEmail).then(function (foundBank) {
        if (foundBank.status == 'error') {
          return Q.reject(foundBank.message);
        } else {

          var createWalletQ = getCreateWallet(ownerEmail);

          var promise = createWalletQ()
            .then(convertRippleToRiwebWallet(ownerEmail))
            .then(saveWalletToDb)
            .then(function (createdWallet) {
              return fundWallet(createdWallet, foundBank.bank.hotWallet, 60);
            });

          return promise;
        }
      });

      return bankWalletQ;

    } else {
      return Q(foundWallet);      
    }
  }).then(function(foundWallet){
    deferred.resolve(foundWallet);
    socket.emit('post:create_wallet', foundWallet.address);
  }, 
  function(errorMessage){
    deferred.reject(errorMessage);
    socket.emit('post:create_wallet', {error : errorMessage});    
  });

  return deferred.promise;
}


exports.createWalletForEmail = createWalletForEmail;
exports.fundWallet = fundWallet;
exports.getBankForUser = getBankForUser;

exports.register = function(newSocket) {
  socket = newSocket;
  socket.on('create_wallet', function(data) {
      createWalletForEmail(data.ownerEmail, data.role);
  });
};
