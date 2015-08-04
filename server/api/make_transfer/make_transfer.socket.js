/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amount) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet]).spread(function (senderWalletPromise, recvWalletPromise) {
        var deferred = Q.defer();

        var senderWallets = senderWalletPromise.value;
        var recvWallets = recvWalletPromise.value;

        function buildMissingError() {
            var result = {
                fromEmail: fromEmail,
                toEmail: toEmail,
                amount: amount,
                status: 'error',
                message: 'missing account'
            };

            Utils.getEventEmitter().emit('post:make_transfer', result);
            deferred.resolve(result);
        }
        
        var senderWallet, recvWallet;
        
        if (senderWallets && senderWallets.constructor === Array) {
            if (!(senderWallets.length === 1 && recvWallets.length === 1)) {
                buildMissingError();

                return deferred.promise;
            }

            senderWallet = senderWallets[0];
            recvWallet = recvWallets[0];
        } else {
            if (!senderWallets || !recvWallets) {
                buildMissingError();

                return deferred.promise;
            }

            senderWallet = senderWallets;
            recvWallet = recvWallets;
        }

        Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
            var transaction = remote.createTransaction('Payment', {
                account: senderWallet.address,
                destination: recvWallet.address,
                amount: amount + '/EUR/' + Utils.ROOT_RIPPLE_ACCOUNT.address
            });

            transaction.submit(function (err, res) {
                if (err) {
                    console.log(err);
                    Utils.getEventEmitter().emit('post:make_transfer', {
                        fromEmail: fromEmail,
                        toEmail: toEmail,
                        amount: amount,
                        message: 'Ripple error',
                        status: 'ripple error'
                    });
                    var stupidJavascriptError;
                    try {
                        stupidJavascriptError = new Error('ripple error')
                    } catch (e) {
                        deferred.reject(e);
                    }
                }
                if (res) {
                    Utils.getEventEmitter().emit('post:make_transfer', {
                        fromEmail: fromEmail,
                        toEmail: toEmail,
                        amount: amount,
                        status: 'success'
                    });
                    deferred.resolve({ status: 'success', transaction: transaction });
                }

            });
        });
        return deferred.promise;

    });
}

exports.makeTransfer = makeTransfer;

exports.register = function (socket) {
    Utils.getEventEmitter().on('post:make_transfer', function (data) {
        socket.emit('post:make_transfer', data);
    });

    Utils.getEventEmitter().on('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });

    socket.on('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount);
    });
};
