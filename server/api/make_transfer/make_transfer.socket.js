/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var CreateWallet = require('./../create_wallet/create_wallet.socket');
var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amount) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    var promiseFindIssuingBank = CreateWallet.getBankForUser(fromEmail);

    return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindIssuingBank])
            .spread(function (senderWalletPromise, recvWalletPromise, findIssuingBankPromise) {
        var deferred = Q.defer();

        var senderWallets = senderWalletPromise.value;
        var recvWallets = recvWalletPromise.value;
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
        
        var senderWallet, recvWallet, issuingAddress;
        
        if (senderWallets.constructor === Array) {
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
        if (!findIssuingBank || findIssuingBank.status == 'error' || !findIssuingBank.bank 
            || !findIssuingBank.bank.hotWallet || !findIssuingBank.bank.hotWallet.address) {
                
            buildMissingError('issuing bank not resolved');
                        
            return deferred.promise;            
        } else {
            issuingAddress = findIssuingBank.bank.hotWallet.address;
        }

        
        Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
            var transaction = remote.createTransaction('Payment', {
                account: senderWallet.address,
                destination: recvWallet.address,
                amount: amount + '/EUR/' + findIssuingBank.bank.hotWallet.address
            });

            transaction.submit(function (err, res) {
                if (err) {
                    console.log(err);
                    Utils.getEventEmitter().emit('post:make_transfer', {
                        fromEmail: fromEmail,
                        toEmail: toEmail,
                        amount: amount,
                        issuer: issuingAddress,
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
