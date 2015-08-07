/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var Wallet = require('./../wallet/wallet.model');
var BankAccount = require('../bankaccount/bankaccount.model');
var CreateWallet = require('./../create_wallet/create_wallet.socket');
var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amount) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    var promiseFindIssuingBank = CreateWallet.getBankForUser(fromEmail);

    var promiseFindSenderBankAccount = BankAccount.findOneQ({ email: fromEmail });

    return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindIssuingBank, promiseFindSenderBankAccount])
        .spread(function (senderWalletPromise, recvWalletPromise, findIssuingBankPromise, senderBankPromise) {
            var deferred = Q.defer();

            var senderWallet = senderWalletPromise.value;
            var recvWallet = recvWalletPromise.value;
            var senderBank = senderBankPromise.value;
            var findIssuingBank = findIssuingBankPromise.value;

            function buildMissingError(errorMessage) {
                errorMessage = errorMessage || 'missing account';
                var result = {
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    amount: amount,
                    issuer: issuingAddress,
                    status: 'error',
                    message: errorMessage
                };

                Utils.getEventEmitter().emit('post:make_transfer', result);
                deferred.resolve(result);
            }

            var issuingAddress;
        
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

            if (!senderBank) {
                if (!findIssuingBank || findIssuingBank.status == 'error' || !findIssuingBank.bank
                    || !findIssuingBank.bank.hotWallet || !findIssuingBank.bank.hotWallet.address) {

                    buildMissingError('issuing bank not resolved');

                    return deferred.promise;
                } else {
                    issuingAddress = findIssuingBank.bank.hotWallet.address;
                }
            } else {
                // Sender is a bank
                issuingAddress = senderBank.hotWallet.address;
            }


            Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
                var transaction = remote.createTransaction('Payment', {
                    account: senderWallet.address,
                    destination: recvWallet.address,
                    amount: amount + '/EUR/' + issuingAddress,
                });

                transaction.submit(function (err, res) {
                    if (err) {
                        Utils.getEventEmitter().emit('post:make_transfer', {
                            fromEmail: fromEmail,
                            toEmail: toEmail,
                            amount: amount,
                            issuer: issuingAddress,
                            message: 'Ripple error',
                            status: 'ripple error'
                        });
                        
                        deferred.reject(err);
                    }
                    if (res) {
                        Utils.getEventEmitter().emit('post:make_transfer', {
                            fromEmail: fromEmail,
                            toEmail: toEmail,
                            amount: amount,
                            issuer: issuingAddress,
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
