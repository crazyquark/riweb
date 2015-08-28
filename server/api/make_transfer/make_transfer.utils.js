/**
 * Utililty functions for make_transfer
 */

'use strict';

var Q = require('q');
var OrderRequests = require('../order_request/order_request.model');
var Order = require('../Order/Order.model');
var RippleUtils = require('ripple-lib').utils;
var makeRippleTransfer = require('../MakeRippleTransfer/MakeRippleTransfer.service');

var Q = require('q');
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

function checkSufficientBalance(realBankAccount, amount) {
    if (!realBankAccount || realBankAccount.status === 'error') {
        return { status: 'error', error: 'External IBAN not found' };
    }

    if (!realBankAccount.account.canDepositToRipple(amount)) {
        return { status: 'error', error: 'Not enough funds for bank deposit' };
    }

    return { status: 'success' };
}

function isDestinationOnDifferentBank(destUserBank, issuingAddress) {
    return destUserBank && destUserBank.hotWallet.address !== issuingAddress;
}


function getPreTransferAction(transfer) {
/*{
 sourceBank : sourceBank,
 senderWallet: senderWallet,
 senderRealBankAccount: senderRealBankAccount,
 amount: amount*/
    transfer.senderRealBankAccount.account.depositToRipple(transfer.amount).then(function() {
        // senderWallet, recvWallet, dstIssuer, amount, srcIssuer, orderInfo
        return makeRippleTransfer(transfer.sourceBank.bank.hotWallet, transfer.sourceBank.bank.hotWallet.address, transfer.senderWallet, transfer.amount);
    },
    function(err){
      return Q({status: 'error', error: err});
    });
}

function getPostTransferAction(destAccount, destBankAccount, realBankAccount, amount) {
    return realBankAccount && realBankAccount.account.withdrawFromRipple(amount);
}

function getRollbackTransferAction(sourceBank, realBankAccount, amount) {

    if (sourceBank && sourceBank.sourceRole === 'admin') {
        return realBankAccount.account.withdrawFromRipple(amount);
    } else {
        //in case it's an internal ripple transaction, just fake the external DB interaction
        return Q({ status: 'success' });
    }
}


function createPaymentTransaction(remote, paymentData, orderRequestId, srcIssuer, amount) {
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

exports.saveOrderToDB = saveOrderToDB;
exports.checkSufficientBalance = checkSufficientBalance;
exports.isDestinationOnDifferentBank = isDestinationOnDifferentBank;
exports.getPreTransferAction = getPreTransferAction;
exports.getRollbackTransferAction = getRollbackTransferAction;
exports.createPaymentTransaction = createPaymentTransaction;
