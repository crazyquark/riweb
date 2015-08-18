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
var Utils = require('./../../utils/utils');

var debug = require('debug')('MakeTransfer');

function saveOrderToDB(orderInfo) {
    OrderRequests.findOneQ({ _id: orderInfo.orderRequestId }).then(function (orderRequest) {
        debug('found order request: ', orderRequest);
        Order.save(orderInfo).then(function (savedOrder) {
            debug('Saved order: ', savedOrder);
        }, function (err) {

        });
    }, function (err) {
        debug('failed to find order request with ID: ', orderInfo.orderRequestId);
    });
}

function makeTransfer(fromEmail, toEmail, amount, orderRequestId) {
    var promiseFindSenderWallet = Wallet.findByOwnerEmail(fromEmail);
    var promiseFindRecvWallet = Wallet.findByOwnerEmail(toEmail);

    var promiseFindIssuingBank = CreateWallet.getBankForUser(fromEmail);
    var promiseFindDestUserBank = CreateWallet.getBankForUser(toEmail); // If the destination user is from another bank
    
    var promiseFindSenderBankAccount = BankAccount.findOneQ({ email: fromEmail });

    return Q.allSettled([promiseFindSenderWallet, promiseFindRecvWallet, promiseFindIssuingBank, promiseFindSenderBankAccount, promiseFindDestUserBank])
        .spread(function (senderWalletPromise, recvWalletPromise, findIssuingBankPromise, senderBankPromise, destUserBankPromise) {
            var deferred = Q.defer();

            var senderWallet = senderWalletPromise.value;
            var recvWallet = recvWalletPromise.value;
            var senderBank = senderBankPromise.value;
            var findIssuingBank = findIssuingBankPromise.value;
            var destUserBank = destUserBankPromise.value ? destUserBankPromise.value.bank : null;

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

            var issuingAddress, srcIssuer;

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
                if (!findIssuingBank || findIssuingBank.status === 'error' || !findIssuingBank.bank ||
                    !findIssuingBank.bank.hotWallet || !findIssuingBank.bank.hotWallet.address) {

                    buildMissingError('issuing bank not resolved');

                    return deferred.promise;
                } else {
                    issuingAddress = findIssuingBank.bank.hotWallet.address;
                }
            } else {
                // Sender is a bank
                issuingAddress = senderBank.hotWallet.address;
            }

            if (destUserBank && destUserBank.hotWallet.address !== issuingAddress) {
                // Is the destination user from another bank?
                srcIssuer = issuingAddress;
                issuingAddress = destUserBank.hotWallet.address;
                // XXX fix non-intuive var names
            }

            var orderInfo = null;
            if (orderRequestId) {
                orderInfo = {
                    requestId: orderRequestId,
                    senderEmail: fromEmail,
                    receiverEmail: toEmail,
                    amount: amount,
                    status: '',
                };
            }

            makeTransferWithRipple(senderWallet, recvWallet, issuingAddress, amount, srcIssuer).then(function (transaction) {
                Utils.getEventEmitter().emit('post:make_transfer', {
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    amount: amount,
                    issuer: issuingAddress,
                    status: 'success'
                });

                if (orderInfo) {
                    orderInfo.status = 'rippleSuccess';
                    saveOrderToDB(orderInfo);
                }

                deferred.resolve({ status: 'success', transaction: transaction });
            }, function (err) {
                var errorMessage = 'Ripple error. Cannot transfer from ' + fromEmail + ' to ' + toEmail + ' ' + amount + ' €!';
                Utils.getEventEmitter().emit('post:make_transfer', {
                    fromEmail: fromEmail,
                    toEmail: toEmail,
                    amount: amount,
                    issuer: issuingAddress,
                    message: errorMessage,
                    status: 'ripple error'
                });

                if (orderInfo) {
                    orderInfo.status = 'rippleError';
                    saveOrderToDB(orderInfo);
                }

                deferred.reject(err);
            });

            return deferred.promise;
        });
}

function makeTransferWithRipple(senderWallet, recvWallet, dstIssuer, amount, srcIssuer) {
    debug('makeTransferWithRipple', senderWallet, recvWallet, dstIssuer, amount, srcIssuer);
    var deferred = Q.defer();

    dstIssuer = dstIssuer || senderWallet.address; // Normal issuer, for single gateway transactions
    // Can't assume anything about source issuer!

    Utils.getNewConnectedRemote(senderWallet.address, senderWallet.secret).then(function (remote) {
        var transaction = remote.createTransaction('Payment', {
            account: senderWallet.address,
            destination: recvWallet.address,
            amount: amount + '/EUR/' + dstIssuer,
        });

        // Append it if you got it
        if (srcIssuer) {
            var maxValue = amount.toString(); // Send all; original code from ripple-rest is:
            // new BigNumber(payment.source_amount.value).plus(payment.source_slippage || 0).toString();
            transaction.sendMax({
                value: maxValue,
                currency: 'EUR',      // EUR foreveeer
                issuer: srcIssuer,    // Gotcha!
            });
        }

        transaction.submit(function (err, res) {
            if (err) {
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
    Utils.getEventEmitter().on('post:make_transfer', function (data) {
        socket.emit('post:make_transfer', data);
    });

    Utils.getEventEmitter().on('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });

    socket.on('make_transfer', function (data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amount, data.orderRequestId);
    });
};
