/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amount){
  var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
  var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);
  
  return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet]).spread(function(senderWalletPromise, recvWalletPromise) {
     var deferred = Q.defer();
     
     var senderWallets = senderWalletPromise.value;
     var recvWallets = recvWalletPromise.value;
     
     if (!(senderWallets.length === 1 && recvWallets.length === 1)) {
         var result = {
             status: 'error',
             error: 'missing account'
         };
         Utils.getEventEmitter().emit('post:make_transfer', result);
         deferred.resolve(result);
         
         return deferred.promise;
     }
       
     var senderWallet = senderWallets[0];
     var recvWallet = recvWallets[0];
     
     Utils.getNewConnectedRemote(senderWallet.publicKey, senderWallet.passphrase).then(function(remote) {
        var transaction = remote.createTransaction('Payment', {
            account: senderWallet.publicKey,
            destination: recvWallet.publicKey,
            amount: amount + '/EUR/' + Utils.ROOT_RIPPLE_ACCOUNT.address
        });
    
        transaction.submit(function (err, res) {
            if (err) {
                console.log(err);
                deferred.reject(err);
            }
            if (res) {
                Utils.getEventEmitter().emit('post:make_transfer', {
                    fromEmail:  fromEmail,
                    toEmail:    toEmail,
                    amount:     amount,
                    status:     'success'
                });
                deferred.resolve({status: 'success', transaction: transaction});
            }

        });
     });
     return deferred.promise;
      
  });
}

exports.makeTransfer = makeTransfer;

exports.register = function(socket) {
    console.log('register post:make_transfer');
    Utils.getEventEmitter().on('post:make_transfer', function(data) {
        console.log('post:make_transfer', data);
        socket.emit('post:make_transfer', data);
    });

    Utils.getEventEmitter().on('make_transfer', function(data) {
        console.log('EventEmitter.on make_transfer', data);
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });
    
    socket.on('make_transfer', function(data) {
        console.log('socket.on make_transfer', data);
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });
};
