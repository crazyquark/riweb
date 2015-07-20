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
     
     var senderWallet = senderWalletPromise.value;
     var recvWallet = recvWalletPromise.value;
     
     Utils.getNewConnectedRemote(senderWallet.publicKey, senderWallet.passphrase).then(function(remote) {
          
        var transaction = remote.createTransaction('Payment', {
            account: senderWallet.publicKey,
            destination: recvWallet.publicKey,
            amount: amount + '/EUR/' + senderWallet.publicKey
        });
    
        transaction.submit(function (err, res) {

            if (err) {
                deferred.reject({status:'error',error: err});
            }
            if (res) {
                Utils.getEventEmitter().emit('make_transfer:success', {
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    amount: amount,
                    status: 'success'
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
    Utils.getEventEmitter().on('make_transfer:success', function(data) {
        socket.emit('make_transfer:success', data);
    });

    Utils.getEventEmitter().on('make_transfer', function(data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });
    
    socket.on('make_transfer', function(data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });
};
