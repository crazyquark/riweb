/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var Wallet = require('./../wallet/wallet.model');
var BankAccount = require('../bankaccount/bankaccount.model');
var CreateWallet = require('./../create_wallet/create_wallet.socket');
var Order = require('../Order/Order.model');
var OrderRequests = require('../order_request/order_request.model');
var RealBankAccount = require('../RealBankAccount/RealBankAccount.socket');
var Utils = require('./../../utils/utils');
var RippleUtils = require('ripple-lib').utils;

var debug = require('debug')('MakeTransfer');

function saveOrderToDB(orderInfo) {
    OrderRequests.findOneQ({ _id: orderInfo.orderRequestId }).then(function (orderRequest) {
        debug('found order request: ', orderRequest);
        Order.createQ(orderInfo).then(function (savedOrder) {
            debug('Saved order: ', savedOrder);
        }, function (err) {
            debug('error', err);
        });
    }, function () {
        debug('failed to find order request with ID: ', orderInfo.orderRequestId);
    });
}

function isIssuingBankValid(issuingBank) {
    return issuingBank && issuingBank.status !== 'error' && issuingBank.bank && issuingBank.bank.hotWallet && issuingBank.bank.hotWallet.address;
}

function buildThrowMissingError(clientEventEmitter, fromEmail, toEmail, amount){

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

function isDestinationOnDifferentBank(destUserBank, issuingAddress) {
    return destUserBank && destUserBank.hotWallet.address !== issuingAddress;
}

function checkSufficientBalance(realBankAccount, amount, err) {
    if (!realBankAccount || realBankAccount.status === 'error') {
        err = 'external IBAN not found';
        return false;
    }

    if (!realBankAccount.account.canDepositToRipple(amount)) {
        err = 'Not enough funds for bank deposit';
        return false;
    }

    return true;
}

function getPreTransferAction(sourceBank, realBankAccount, amount) {

    if (sourceBank && sourceBank.sourceRole === 'admin') {
        return realBankAccount.account.depositToRipple(amount);
    } else {
        //in case it's an internal ripple transaction, just fake the external DB interaction
        return Q({ status: 'success' });
    }
}

function getRollbackTransferAction(sourceBank, realBankAccount, amount) {

    if (sourceBank && sourceBank.sourceRole === 'admin') {
        return realBankAccount.account.withdrawFromRipple(amount);
    } else {
        //in case it's an internal ripple transaction, just fake the external DB interaction
        return Q({ status: 'success' });
    }
}

function buildMakeTransferWithRippleWallets(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId) {

    var throwMissingError = buildThrowMissingError(clientEventEmitter, fromEmail, toEmail, amount);

    function makeTransferWithRippleWallets(senderWallet, recvWallet, sourceBank, destUserBankParam, realBankAccount) {
        var deferred = Q.defer();

        var destUserBank = destUserBankParam? destUserBankParam.bank : null;

        var issuingAddress, sourceIssuingAddressIfDifferent;

        // If the sender was a bank admin, get its wallet from bankaccounts
        if (!senderWallet && sourceBank.status !== 'error' && sourceBank.sourceRole === 'admin') {
            senderWallet = sourceBank.bank.hotWallet;
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
            deferred.reject(throwMissingError());
            return deferred.promise;
        }

        if (!isIssuingBankValid(sourceBank)) {
            deferred.reject(throwMissingError('issuing bank not resolved', undefined));
            return deferred.promise;
        }

        issuingAddress = sourceBank.bank.hotWallet.address;

        if (isDestinationOnDifferentBank(destUserBank, issuingAddress)) {
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

        if (sourceBank.sourceRole === 'admin') {
            //we need to check if the user really does have the necessary funds
            var err;
            if (!checkSufficientBalance(realBankAccount, amount, err))
            {
                deferred.reject(throwMissingError(err, issuingAddress));
                return deferred.promise;
            }
        }

        //TODO: also add the equivalent for destination
        var preTransferPromise = getPreTransferAction(sourceBank, realBankAccount, amount);

        preTransferPromise.then(function (depositResult) {
            var deposit = Q.defer();

            if (depositResult.status === 'success') {

                makeTransferWithRipple(senderWallet, recvWallet, issuingAddress, amount, sourceIssuingAddressIfDifferent, orderInfo).then(function (transaction) {

                    if (orderInfo) {
                        orderInfo.status = 'rippleSuccess';
                        saveOrderToDB(orderInfo);
                    }

                    deposit.resolve({ status: 'success', transaction: transaction });

                }, function (err) {

                    if (orderInfo) {
                        orderInfo.status = 'rippleError';
                        saveOrderToDB(orderInfo);
                    }

                    //undo the deposit action (if needed)
                    var rollbackTransferActionPromise = getRollbackTransferAction(sourceBank, realBankAccount, amount);

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

    var currentMakeTransferWithRippleWallets = buildMakeTransferWithRippleWallets(clientEventEmitter, fromEmail, toEmail, amount, orderRequestId);

    return Q.all([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindIssuingBank, promiseFindDestUserBank, promiseFindSenderRealBankAccount])
        .spread(currentMakeTransferWithRippleWallets);
}

function createPaymentTransaction(remote, paymentData, orderRequestId, srcIssuer, amount){
    var transaction = remote.createTransaction('Payment', paymentData);
    transaction.lastLedger(remote.getLedgerSequence() + 10); // Wait at most 10 ledger sequences

    // Save order info on the blockchain
    if (orderRequestId) {
        transaction.tx_json.Memos = [
            {
                Memo: {
                    MemoType: RippleUtils.stringToHex('OrderRequestId'),
                    MemoData: RippleUtils.stringToHex(orderRequestId)
                }
            }
        ];
    }

    // Append it if you got it
    if (srcIssuer) {
        var maxValue = amount.toString(); // Send all; original code from ripple-rest is:
        // new BigNumber(payment.source_amount.value).plus(payment.source_slippage || 0).toString();
        transaction.sendMax({
            value: maxValue,
            currency: 'EUR',      // EUR foreveeer
            issuer: srcIssuer    // Gotcha!
        });
    }


    transaction.on('resubmit', function () {
        debug('resubmitting ', transaction);
    });

    return transaction;
}

function makeTransferWithRipple(senderWallet, recvWallet, dstIssuer, amount, srcIssuer, orderInfo) {
    debug('makeTransferWithRipple', senderWallet, recvWallet, dstIssuer, amount, srcIssuer);
    var deferred = Q.defer();

    dstIssuer = dstIssuer || senderWallet.address; // Normal issuer, for single gateway transactions
    // Can't assume anything about source issuer!

    Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
        var paymentData = {
            account: senderWallet.address,
            destination: recvWallet.address,
            amount: amount + '/EUR/' + dstIssuer
        };

        var orderRequestId = orderInfo?orderInfo.orderRequestId:null;

        var transaction = createPaymentTransaction(remote, paymentData, orderRequestId, srcIssuer, amount);

        transaction.submit(function (err, res) {
            if (err) {
                debug('transaction seems to have failed: ', err);
                deferred.reject(err);
            }
            if (res) {
                deferred.resolve({ status: 'success', transaction: transaction });
            }
        });

    });
    return deferred.promise;
}

exports.makeTransfer = makeTransfer;
exports.makeTransferWithRipple = makeTransferWithRipple;

exports.register = function(clientEventEmitter) {

    clientEventEmitter.forwardFromEventEmitterToSocket('post:make_transfer');

    clientEventEmitter.on('make_transfer', function (data) {
        makeTransfer(clientEventEmitter, data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });

    clientEventEmitter.onSocketEvent('make_transfer', function (data) {
        makeTransfer(clientEventEmitter, data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });
};
