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
var SetRootFlags = require('../set_root_flags/set_root_flags.socket');

var debug = require('debug')('CreateWallet');

var socket;

//var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function fundWallet(wallet, sourceWallet, amount) {
  debug('fundWallet', wallet, amount);
  var deferred = Q.defer();

  amount = amount || 60;

  var ripple_address = wallet.address;

  //TODO: this needs to be moved to the BANK registration section
  Utils.getNewConnectedRemote(sourceWallet.address, sourceWallet.secret).then(function(remote) {
  var options = { account: sourceWallet.address,
                  destination: ripple_address,
                  amount : amount * 1000000
                };
  
  function setTrustEmit() {
    deferred.resolve(wallet);
    Utils.emitEvent('set_trust', {
      rippleDestinationAddr: sourceWallet.address,
      rippleSourceAddr: wallet.address,
      rippleSourceSecret: wallet.secret
     });
   }
          
  var transaction = remote.createTransaction('Payment', options);
  transaction.lastLedger(remote.getLedgerSequence() + 10); // Wait at most 10 ledger sequences
  
  debug('fundWallet remote.createTransaction', options);
  transaction.submit(function (err) {
      debug('fundWallet transaction.submit', err);
      if (err) {
          debug('Failed to make initial XRP transfer because: ' + err);
          deferred.reject(err);
      } else {
          debug('Successfully funded wallet ' + ripple_address + ' with ' + amount + ' XRP');
          if (sourceWallet.address === Utils.ROOT_RIPPLE_ACCOUNT.address) {
                            
              SetRootFlags.setRootFlags(wallet).then(function(res) {
                if (res.status === 'success') {
                  deferred.resolve(wallet);
                } 
              }, function(err) {
                deferred.reject(err);
              });
          } else {
            //normal user - trust the bank!
            setTrustEmit();
          }
      }
    });
});

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
        var existingBankWallet = BankAccount.findOneQ({ email: ownerEmail }).then(function (bank) {
          return Q(bank.hotWallet);
        });
        
        return existingBankWallet; 
      }
      
      var bankWalletQ = getBankForUser(ownerEmail).then(function (foundBank) {
        if (foundBank.status === 'error') {
          return Q.reject(foundBank.message);
        } else {

          var createWalletQ = getCreateWallet(ownerEmail);

          var promise = createWalletQ()
            .then(convertRippleToRiwebWallet(ownerEmail))
            .then(function(wallet) {
              return fundWallet(wallet, foundBank.bank.hotWallet, 60);
            })
            .then(function (fundedWallet) {
              return saveWalletToDb(fundedWallet);
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
    Utils.emitEvent('post:create_wallet', {address: foundWallet.address});
  }, 
  function(errorMessage){
    deferred.reject(errorMessage);
    Utils.emitEvent('post:create_wallet', {error : errorMessage});
  });

  return deferred.promise;
}


exports.createWalletForEmail = createWalletForEmail;
exports.fundWallet = fundWallet;
exports.getBankForUser = getBankForUser;

exports.register = function(newSocket) {
  socket = newSocket;

  Utils.forwardFromEventEmitterToSocket('post:create_wallet', socket);

  socket.on('create_wallet', function(data) {
      createWalletForEmail(data.ownerEmail, data.role);
  });
};
