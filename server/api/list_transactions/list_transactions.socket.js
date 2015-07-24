/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

function findEmailFromAddress(rippleAddress){
	return Wallet.findByRippleAddress(rippleAddress).then(function(foundWallet){
		if(!foundWallet){
			return '<<< deleted account >>>';
		} else {
			return foundWallet.ownerEmail;
		}
	})
}

function convertRippleTxToHuman(transaction){
	
  var sourceEmailPromise = findEmailFromAddress(transaction.tx.Account);
  var destinationEmailPromise = findEmailFromAddress(transaction.tx.Destination);
  return Q.all([sourceEmailPromise, destinationEmailPromise]).spread(function(sourceEmail, destinationEmail){
		var transactionHuman = {
					source: sourceEmail,
					destination: destinationEmail,
					amount: transaction.tx.Amount.value + '€',
					fee: transaction.tx.Fee};
					
		return transactionHuman;
  });
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
     				var transactionPromises = [];

					res.transactions.forEach(function(rippleTx){
						if (rippleTx.tx.TransactionType === 'Payment' &&
							typeof rippleTx.tx.Amount === 'object') {
								transactionPromises.push(convertRippleTxToHuman(rippleTx));
						}
					});
					Q.all(transactionPromises).then(function(transactionsHuman){
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

exports.listTransactions = listTransactions;
exports.register = function (socket) {
	socket.on('list_transactions', function (ownerEmail) {
		listTransactions(ownerEmail, socket);
	});
}
