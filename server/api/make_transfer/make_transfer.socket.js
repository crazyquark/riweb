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
    return issuingBank && !issuingBank.error && issuingBank.bankWallet && issuingBank.bankWallet.address;
}

function buildThrowMissingError(fromEmail, toEmail, amount){

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

        Utils.emitEvent('post:make_transfer', result);
        return result;
    }
    return throwMissingError;
}

function isDestinationOnDifferentBank(destUserBank, issuingAddress) {
    return destUserBank && destUserBank.hotWallet.address !== issuingAddress;
}

function getPreTransferAction(sourceBankAddress, realBankAccount, amount) { 

    if (!sourceBankAddress.isFromUser) {
        return realBankAccount.account.deposit(amount);
    } else {
        //in case it's an internal ripple transaction, just fake the external DB interaction
        return Q({ status: 'success' });
    }
}

function getRollbackTransferAction(sourceBankAddress, realBankAccount, amount) {

    if (!sourceBankAddress.isFromUser) {
        return realBankAccount.account.withdraw(amount);
    } else {
        //in case it's an internal ripple transaction, just fake the external DB interaction
        return Q({ status: 'success' });
    }
}

function buildMakeTransferWithRippleWallets(fromEmail, toEmail, amount, orderRequestId) {

    var throwMissingError = buildThrowMissingError(fromEmail, toEmail, amount);

    function makeTransferWithRippleWallets(senderWallet, recvWallet, sourceBankAddress, destUserBankParam, realBankAccount) {
        var deferred = Q.defer();

        var destUserBank = destUserBankParam? destUserBankParam.bank : null;

        var issuingAddress, srcIssuer;

        // If the sender was a bank admin, get its wallet from bankaccounts
        if (!senderWallet && !sourceBankAddress.error && !sourceBankAddress.isFromUser) {
            senderWallet = sourceBankAddress.bankWallet;
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

        if (!isIssuingBankValid(sourceBankAddress)) {
            deferred.reject(throwMissingError('issuing bank not resolved', issuingAddress));
            return deferred.promise;
        }

        issuingAddress = sourceBankAddress.bankWallet.address;

        if (isDestinationOnDifferentBank(destUserBank, issuingAddress)) {
            srcIssuer = issuingAddress;
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

        if (!sourceBankAddress.isFromUser) {
            //we need to check if the user really does have the necessary funds

            if (!realBankAccount || realBankAccount.status === 'error') {

                deferred.reject(throwMissingError('external IBAN not found', issuingAddress));
                return deferred.promise;
            }

            if (!realBankAccount.account.canDeposit(amount)) {

                deferred.reject(throwMissingError('Not enough funds for bank deposit', issuingAddress));
                return deferred.promise;
            }
        }

        //TODO: also add the equivalent for destination
        var preTransferPromise = getPreTransferAction(sourceBankAddress, realBankAccount, amount);  

        preTransferPromise.then(function (depositResult) {
            var deposit = Q.defer();

            if (depositResult.status === 'success') {

                makeTransferWithRipple(senderWallet, recvWallet, issuingAddress, amount, srcIssuer, orderInfo).then(function (transaction) {

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
                    var rollbackTransferActionPromise = getRollbackTransferAction(sourceBankAddress, realBankAccount, amount);

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
                Utils.emitEvent('post:make_transfer', {
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

      
function findSenderBankOrUserBank(issuingBankForUser, senderBankAccount) {

    if (senderBankAccount) {        
        return {bankWallet: senderBankAccount.hotWallet, isFromUser: false };
               
    } else if (issuingBankForUser && issuingBankForUser.status === 'success') {        
        return {bankWallet: issuingBankForUser.bank.hotWallet, isFromUser: true };
                        
    } else {            
        return {error : 'Cannot find source bank account!'};
    }
}

function makeTransfer(fromEmail, toEmail, amount, orderRequestId) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    var promiseFindIssuingBankForUser = CreateWallet.getBankForUser(fromEmail);
    var promiseFindDestUserBank = CreateWallet.getBankForUser(toEmail); // If the destination user is from another bank

    var promiseFindSenderBankAccount = BankAccount.findOneQ({ email: fromEmail });
    var promiseFindSenderRealBankAccount = RealBankAccount.getBankAccountForEmail(toEmail);

    var currentMakeTransferWithRippleWallets = buildMakeTransferWithRippleWallets(fromEmail, toEmail, amount, orderRequestId);

    var promiseFindSenderBankOrUserBank = Q.all([promiseFindIssuingBankForUser, promiseFindSenderBankAccount]).spread(findSenderBankOrUserBank);

    return Q.all([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindSenderBankOrUserBank, promiseFindDestUserBank, promiseFindSenderRealBankAccount])
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

exports.register = function (socket) {

    Utils.forwardFromEventEmitterToSocket('post:make_transfer', socket);

    Utils.onEvent('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });

    socket.on('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });
};
