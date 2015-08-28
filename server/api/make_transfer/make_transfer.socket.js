/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var Wallet = require('./../wallet/wallet.model');
var BankAccount = require('../bankaccount/bankaccount.model');
var CreateWallet = require('./../create_wallet/create_wallet.socket');
var Order = require('../Order/Order.model');
var RealBankAccount = require('../RealBankAccount/RealBankAccount.socket');
var Utils = require('./../../utils/utils');
var MTUtils = require('./make_transfer.utils');
var makeRippleTransfer = require('./../MakeRippleTransfer/MakeRippleTransfer.service');

var debug = require('debug')('MakeTransfer');

function isIssuingBankValid(issuingBank) {
    return issuingBank && issuingBank.status !== 'error' && issuingBank.bank && issuingBank.bank.hotWallet && issuingBank.bank.hotWallet.address;
}

function buildThrowMissingError(clientEventEmitter, fromEmail, toEmail, amount) {

    function throwMissingError(errorMessage, issuingAddress, status) {
        status = status || 'error';
        errorMessage = errorMessage || 'missing account';
        var result = {
            fromEmail: fromEmail,
            toEmail: toEmail,
            amount: amount,
            issuer: issuingAddress,
            status: status,
            message: errorMessage
        };

        clientEventEmitter.emitEvent('post:make_transfer', result);
        return result;
    }
    return throwMissingError;
}

function buildMakeTransferWithRippleWallets(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId) {

    var throwMissingError = buildThrowMissingError(clientEventEmitter, fromEmail, toEmail, amount);

    function makeTransferWithRippleWallets(senderWallet, recvWallet, sourceBank, destBank, senderRealBankAccount, recvRealBankAccount) {
        var deferred = Q.defer();

        var destUserBank = destBank ? destBank.bank : null;

        var issuingAddress, sourceIssuingAddressIfDifferent;

        // If the sender was a bank admin, get its wallet from bankaccounts
        if (!senderWallet && sourceBank.status !== 'error' && sourceBank.sourceRole === 'admin') {
            senderWallet = sourceBank.bank.hotWallet;
        }

        if (!senderWallet || !recvWallet) {
            // At least a wallet is missing, it's a bust
            deferred.reject(throwMissingError());
            return deferred.promise;
        }

        if (!isIssuingBankValid(sourceBank)) {
            deferred.reject(throwMissingError('issuing bank not resolved', undefined));
            return deferred.promise;
        }

        issuingAddress = sourceBank.bank.hotWallet.address;

        if (MTUtils.isDestinationOnDifferentBank(destUserBank, issuingAddress)) {
            sourceIssuingAddressIfDifferent = issuingAddress;
            issuingAddress = destUserBank.hotWallet.address;
        }

        var orderInfo = null;
        if (orderRequestId) {
            orderInfo = {
                orderRequestId: orderRequestId,
                senderEmail: fromEmail,
                receiverEmail: toEmail,
                amount: amount,
                status: ''
            };
        }

        //we need to check if the user really does have the necessary funds
        var check = MTUtils.checkSufficientBalance(senderRealBankAccount, amount);
        if (check.status !== 'success') {
            deferred.reject(throwMissingError(check.error, issuingAddress));
            return deferred.promise;
        }

        //TODO: also add the equivalent for destination
        MTUtils.getPreTransferAction({
                sourceBank : sourceBank,
                senderWallet: senderWallet,
                senderRealBankAccount: senderRealBankAccount,
                amount: amount
            }).then(function (depositResult) {
            var deposit = Q.defer();

            if (depositResult.status === 'success') {
                makeRippleTransfer(senderWallet, recvWallet, issuingAddress, amount, sourceIssuingAddressIfDifferent, orderInfo).then(function (transactionStatus) {

                  if (transactionStatus.status === 'success') {
                    // senderWallet, recvWallet, dstIssuer, amount, srcIssuer, orderInfo
                      makeRippleTransfer(recvWallet, destUserBank.hotWallet, destUserBank.hotWallet.address, amount).then(function () {
                        recvRealBankAccount.account.withdrawFromRipple(amount).then(function () {
                          if (orderInfo) {
                            orderInfo.status = 'rippleSuccess';
                            MTUtils.saveOrderToDB(orderInfo);
                          }

                          deposit.resolve(transactionStatus);
                        })
                      });
                  }
                }, function (err) {
                    if (orderInfo) {
                        orderInfo.status = 'rippleError';
                        MTUtils.saveOrderToDB(orderInfo);
                    }

                    //undo the deposit action (if needed)
                    var rollbackTransferActionPromise = MTUtils.getRollbackTransferAction(sourceBank, senderRealBankAccount, amount);

                    debug('makeTransferWithRipple - ripple error', err);

                    rollbackTransferActionPromise.then(function (withdrawResult) {
                        if (withdrawResult.status === 'success') {
                            deposit.resolve({ status: 'ripple error', message: 'Ripple error' });
                        } else {
                            debug('makeTransferWithRipple - unrecoverable transfer error', amount);
                            deposit.resolve({ status: 'ripple error', message: 'Ripple error & Critical error - money lost!! ' });
                        }
                    });
                });
            } else {
                deposit.resolve({ status: 'error', message: depositResult.message });
            }

            return deposit.promise;
        }).then(function (transferResult) {
            if (transferResult.status === 'success') {
                clientEventEmitter.emitEvent('post:make_transfer', {
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    amount: amount,
                    issuer: issuingAddress,
                    status: 'success'
                });
                deferred.resolve({ status: 'success', transaction: transferResult.transaction });
            } else {
                deferred.reject(throwMissingError(transferResult.message, issuingAddress, transferResult.status));
            }
        });

        return deferred.promise;
    }

    return makeTransferWithRippleWallets;
}



function makeTransfer(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    var promiseFindIssuingBank = CreateWallet.getBankForUser(fromEmail);
    var promiseFindDestUserBank = CreateWallet.getBankForUser(toEmail); // If the destination user is from another bank

    var promiseFindSenderRealBankAccount = RealBankAccount.getRealBankAccountForEmail(toEmail);
    var promiseFindRecvRealBankAccount = RealBankAccount.getRealBankAccountForEmail(toEmail);

    var currentMakeTransferWithRippleWallets = buildMakeTransferWithRippleWallets(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId);

    return Q.all([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindIssuingBank, promiseFindDestUserBank, promiseFindSenderRealBankAccount, promiseFindRecvRealBankAccount])
        .spread(currentMakeTransferWithRippleWallets);
}

exports.makeTransfer = makeTransfer;
exports.makeTransferWithRipple = makeRippleTransfer;

exports.register = function (clientEventEmitter) {

    clientEventEmitter.forwardFromEventEmitterToSocket('post:make_transfer');

    clientEventEmitter.on('make_transfer', function (data) {
        makeTransfer(clientEventEmitter, data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });

    clientEventEmitter.onSocketEvent('make_transfer', function (data) {
        makeTransfer(clientEventEmitter, data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });
};
