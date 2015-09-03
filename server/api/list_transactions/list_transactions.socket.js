/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');

var Utils = require('./../../utils/utils');
var RippleUtils = require('ripple-lib').utils;
var Wallet = require('./../wallet/wallet.model');
var User = require('./../user/user.model');
var BankAccount = require('../bankaccount/bankaccount.model');

var debug = require('debug')('ListTransactions');

function findEmailFromAddress(rippleAddress) {
	return Wallet.findByRippleAddress(rippleAddress).then(function (foundWallet) {
		return foundWallet ? foundWallet.email : null;
	})
}

function findBankFromAddress(rippleAddress) {
	return BankAccount.findByRippleAddress(rippleAddress).then(function (foundBank) {
		debug('BankAccounts.findByRippleAddress', rippleAddress, foundBank);
		return foundBank ? foundBank.email : null;
	})
}

function convertRippleTxToHuman(transaction){

  var sourceEmailPromise = findEmailFromAddress(transaction.tx.Account);
  var sourceBankPromise	 = findBankFromAddress(transaction.tx.Account);
  var destinationEmailPromise = findEmailFromAddress(transaction.tx.Destination);
  var destinationBankPromise  = findBankFromAddress(transaction.tx.Destination);

  return Q.all([sourceEmailPromise, destinationEmailPromise, sourceBankPromise, destinationBankPromise]).spread(function(sourceUserEmail, destinationUserEmail, sourceBankEmail, destinationBankEmail){

	  var sourceEmail = sourceUserEmail?sourceUserEmail:sourceBankEmail;
	  var destinationEmail = destinationUserEmail?destinationUserEmail:destinationBankEmail;

	  var orderRequestId = transaction.tx.Memos && RippleUtils.hexToString(transaction.tx.Memos[0].Memo.MemoData);

    var transactionHuman = {
					source: sourceEmail ? sourceEmail:'<<< deleted account >>>',
					destination: destinationEmail ? destinationEmail:'<<< deleted account >>>',
					amount: transaction.tx.Amount.value + '€',
					orderRequestId: orderRequestId || '',
					fee: transaction.tx.Fee};

		return transactionHuman;
  });
}

function listTransactions(clientEventEmitter, email) {
  var deferred = Q.defer();

	function buildMissingError() {
		var result = {
			email: email,
			status: 'error',
			message: 'missing account'
		};

		clientEventEmitter.emitEvent('post:list_transactions', result);
		deferred.resolve(result);
	}

  User.findByEmail(email).then(function(foundUser) {

  });

	function listRippleTransactions() {
		Utils.getNewConnectedRemote(wallet.address, wallet.secret).then(function (remote) {
			remote.requestAccountTransactions({
				account: wallet.address,
				ledger_index_min: -1,
				ledger_index_max: -1,
				binary: false
			}, function (err, res) {
				var result;
				if (err) {
					result = { status: 'error', message: err.message };
					clientEventEmitter.emitEvent('post:list_transactions', result);
					deferred.resolve(result);
				} else {
					var transactionPromises = [];

					res.transactions.forEach(function (rippleTx) {
						debug(rippleTx);
						if (rippleTx.tx.TransactionType === 'Payment' &&
							typeof rippleTx.tx.Amount === 'object' &&
							rippleTx.meta.TransactionResult === 'tesSUCCESS' /* no failed transactions */ &&
							rippleTx.tx.Memos /* list only order transactions */) {
							transactionPromises.push(convertRippleTxToHuman(rippleTx));
						}
					});
					Q.all(transactionPromises).then(function (transactionsHuman) {
						result = { status: 'success', transactions: transactionsHuman };
						clientEventEmitter.emitEvent('post:list_transactions', result);
						deferred.resolve(result);
					});

				}
			});
		});
	}

	var wallet;
	// TODO Bank admins do not have wallets!
	Wallet.findByEmail(email).then(function (wallets) {
		if (wallets && wallets.constructor === Array) {
			if (wallets.length !== 1) {
				buildMissingError();

				return deferred.promise;
			} else {
				wallet = wallets[0];
			}
		} else {
				wallet = wallets;
		}


		if (wallet) {
			listRippleTransactions();
		} else {
			// OK, could be a bank
			BankAccount.findOneQ({email: email}).then(function(bank) {
				if (bank) {
					wallet = bank.hotWallet;

					listRippleTransactions();
				} else {
					buildMissingError();

					return deferred.promise;
				}
			});
		}
	});

	return deferred.promise;
}

exports.listTransactions = listTransactions;
exports.register = function(clientEventEmitter) {

  clientEventEmitter.forwardFromEventEmitterToSocket('post:list_transactions');

  clientEventEmitter.onSocketEvent('list_transactions', function (email) {
		listTransactions(clientEventEmitter, email);
	});
};
