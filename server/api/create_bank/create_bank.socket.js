/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');
var Bankaccount = require('./../bankaccount/bankaccount.model');

var debug = require('debug')('CreateWallet');

var socket;

var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function createBank(newBank) {
  var deferred = Q.defer();
  
  var newRippleAddress = ripple.Wallet.generate();
  
  var newBankAccount = {
    name: newBank.name,
    info: newBank.info,
    hotWallet: newRippleAddress
  };
  
  Bankaccount.createQ(newBankAccount).then(function(createdBankAccount){
    deferred.resolve(createdBankAccount);
  });
  
  // Bankaccount.findOneQ({ name: newBank.name }).then(function (foundBank) {
  //   if (foundBank && foundBank.name) {
  //     deferred.resolve(foundBank);
  //   } else {
      
  //   }
  // });

  return deferred.promise;
}

exports.createBank = createBank;
exports.register = function (newSocket) {
  socket = newSocket;
  socket.on('create_bank', function (data) {
    createBank(data);
  });
};