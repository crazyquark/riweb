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
                senderIban: senderRealBankAccount.account.iban,
                recvIban: recvRealBankAccount.account.iban,
                amount: amount,
                status: ''
            };
        }

        function orderError(msg) {
            if (orderInfo) {
                orderInfo.status = msg;
                MTUtils.saveOrderToDB(orderInfo);
            }
        }

        // We need to check if the user really does have the necessary funds
        var check = MTUtils.checkSufficientBalance(senderRealBankAccount, amount);
        if (check.status !== 'success') {
            deferred.reject(throwMissingError(check.error, issuingAddress));
            return deferred.promise;
        }

        MTUtils.getPreTransferAction({
            sourceBank: sourceBank,
            senderWallet: senderWallet,
            senderRealBankAccount: senderRealBankAccount,
            amount: amount
        }).then(function (depositResult) {
            var deposit = Q.defer();

            if (depositResult.status === 'success') {
                makeRippleTransfer(senderWallet, recvWallet, issuingAddress, amount, sourceIssuingAddressIfDifferent, orderInfo).then(function (transactionStatus) {
                    if (transactionStatus.status === 'success') {
                        MTUtils.getPostTransferAction(recvWallet, destUserBank, recvRealBankAccount, amount, orderInfo).then(function (postTransferRes) {
                            if (postTransferRes.status === 'success') {
                                deposit.resolve(transactionStatus);
                            }
                        });
                    }
                }, function (err) {
                    orderError('rippleError');

                    MTUtils.performRollbackAction(deferred, deposit, sourceBank, issuingAddress, senderRealBankAccount, amount, throwMissingError, err);
                });
            } else {
                deposit.resolve({ status: 'error', message: depositResult.message });
            }

            return deposit.promise;
        }).then(function (transferResult) {
            MTUtils.processTransferResult(clientEventEmitter, deferred, fromEmail, toEmail, amount, issuingAddress, throwMissingError, transferResult);
        }).fail(function(err){
            MTUtils.processTransferFailure(clientEventEmitter, deferred, fromEmail, toEmail, amount, issuingAddress, err);
        });

        return deferred.promise;
    }

    return makeTransferWithRippleWallets;
}

function makeTransfer(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId) {
    var promiseFindSenderWallet = Wallet.findByEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByEmail(toEmail);

    var promiseFindIssuingBank = CreateWallet.getBankForUser(fromEmail);
    var promiseFindDestUserBank = CreateWallet.getBankForUser(toEmail); // If the destination user is from another bank

    var promiseFindSenderRealBankAccount = RealBankAccount.getRealBankAccountForEmail(fromEmail);
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
