/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var BankAccount = require('../bankaccount/bankaccount.model');
var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amount) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);
    var promiseFindSenderBankAccount = BankAccount.findOneQ({ email: fromEmail }); // TODO what about when the bank is the receiver? should this happen?

    return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindSenderBankAccount])
        .spread(function (senderWalletPromise, recvWalletPromise, senderBankAccount) {

            var deferred = Q.defer();

            var senderWallet = senderWalletPromise.value;
            var recvWallet = recvWalletPromise.value;
            var senderBank = senderBankAccount.value;

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
        
            // If the sender was a bank admin, get its wallet from bankaccounts
            if (!senderWallet && senderBank) {
                senderWallet = senderBank.hotWallet;
            }
        
            // Not sure why these are arrays sometimes
            if (senderWallet && senderWallet.constructor === Array) {
                senderWallet = senderWallet[0];
            }
            if (recvWallet && recvWallet.constructor === Array) {
                recvWallet = recvWallet[0];
            }

            if (!senderWallet || !recvWallet) {
                // At least a wallet is missing, it's a bust
                buildMissingError();
                return deferred.promise;
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
