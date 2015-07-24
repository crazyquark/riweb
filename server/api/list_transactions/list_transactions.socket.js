/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

function translateTransactionsToHuman(transactionsList) {
	var deferred = Q.defer();

	var transactionsListHuman = [];
	var walletsPromises = [];
	var result = [];

	transactionsList.forEach(function (transaction) {

		var transactionHuman = {
			account: transaction.tx.Destination,
			fee: transaction.tx.Fee,
			txType: transaction.tx.TransactionType,
			date: transaction.tx.date,
			amount: transaction.tx.Amount // Amount is a number for XRP or an object { currency, issuer, value } for EUR
		}

		if (transactionHuman.txType == 'Payment') {
			if (typeof transactionHuman.amount === 'object') {
				transactionHuman.amount = transactionHuman.amount.value; // Extract only EUR value	
				transactionsListHuman[transactionHuman.account] = transactionHuman;
				
				// Wait for the owner email from the DB
				walletsPromises.push(Wallet.findByRippleAddress(transactionHuman.account));
			}
		}

	});

	Q.allSettled(walletsPromises)
		.then(function (walletPromisesResults) {
			walletPromisesResults.forEach(function (walletPromiseResult, idx) {
				if (walletPromiseResult.state === 'fulfilled') {
					var transactionHuman = transactionsListHuman[walletsPromises[idx].rippleAddress];
					
					// If the user no longer exists in the DB the promise value will resolve to null
					var wallet = walletPromiseResult.value;
	
					result.push({
						destination: wallet ? wallet.ownerEmail : '<<< deleted account >>>',
						amount: transactionHuman.amount + '€',
						fee: transactionHuman.fee
					});
					
					// Free up some memory, because why not
					delete transactionsListHuman[walletsPromises[idx].rippleAddress];
				}
			});

			deferred.resolve(result);
		});

	return deferred.promise;
}

function listTransactions(ownerEmail, socket) {
	var deferred = Q.defer();

	function buildMissingError() {
		var result = {
			ownerEmail: ownerEmail,
			status: 'error',
			message: 'missing account'
		}

		socket.emit('post:list_transactions', result);
		deferred.resolve(result);
	}

	var wallet;
	Wallet.findByOwnerEmail(ownerEmail).then(function (wallets) {
		if (wallets.constructor == Array) {
			if (wallets.length != 1) {
				buildMissingError();

				return deferred.promise;
			} else {
				wallet = wallets[0];
			}
		} else {
			if (!wallets) {
				buildMissingError();

				return deferred.promise;
			} else {
				wallet = wallets;
			}
		}

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
					socket.emit('post:list_transactions', result);
					deferred.resolve(result);
				} else {
					translateTransactionsToHuman(res.transactions)
						.then(function (transactionsHuman) {
							result = { status: 'success', transactions: transactionsHuman };
							socket.emit('post:list_transactions', result);
							deferred.resolve(result);
						});
				}
			});
		});
	});

	return deferred.promise;
}

exports.register = function (socket) {
	socket.on('list_transactions', function (ownerEmail) {
		listTransactions(ownerEmail, socket);
	});
}
