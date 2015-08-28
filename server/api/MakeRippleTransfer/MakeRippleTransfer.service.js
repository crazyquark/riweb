/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Utils = require('./../../utils/utils');
var MTUtils = require('./../make_transfer/make_transfer.utils');
var EventEmitter = require('events').EventEmitter;
var debug = require('debug')('MakeRippleTransfer');
var Q = require('q');

function makeRippleTransfer(senderWallet, recvWallet, dstIssuer, amount, srcIssuer, orderInfo) {
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

    var orderRequestId = orderInfo ? orderInfo.orderRequestId : null;

    var transaction = MTUtils.createPaymentTransaction(remote, paymentData, orderRequestId, srcIssuer, amount);

    transaction.submit(function (err, res) {
      if (err) {
        debug('transaction seems to have failed: ', err);
        deferred.reject({ status: 'error', error: err });
      }
      if (res) {
        deferred.resolve({ status: 'success', transaction: transaction });
      }
    });

  });
  return deferred.promise;
}

module.exports = makeRippleTransfer;
