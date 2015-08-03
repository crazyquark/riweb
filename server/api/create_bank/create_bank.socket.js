/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');
var Bankaccount = require('./../bankaccount/bankaccount.model');

var debug = require('debug')('CreateBank');

var socket;

var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function createNewBank(newBank) {
  var newRippleAddress = ripple.Wallet.generate();

  var newBankAccount = {
    name: newBank.name,
    info: newBank.info,
    hotWallet: newRippleAddress
  };

  return Bankaccount.createQ(newBankAccount);
}


function createBank(newBank) {
  var deferred = Q.defer();

  Bankaccount.findOneQ({ name: newBank.name }).then(function (foundBank) {
    if (foundBank) {
      debug('Found existing bank', foundBank.name);
      deferred.reject(null);
    } else {
      createNewBank(newBank).then(function (createdBank) {
        debug('resolve create', createdBank.info);
        deferred.resolve(createdBank);
        
        Utils.getEventEmitter().emit('create_admin_user_for_bank', {
          bankId: createdBank._id,
          email: newBank.email,
          password: newBank.password,
        })
      });
    }
  });

  return deferred.promise;
}

exports.createBank = createBank;
exports.register = function (newSocket) {
  socket = newSocket;
  socket.on('create_bank', function (data) {
    createBank(data)
      .then(function (bank) {
        socket.emit('post:create_admin_user_for_bank', { status: 'success', bank: bank });
      })
      .fail(function (error) {
        socket.emit('post:create_admin_user_for_bank', { status: 'error', error: 'Bank already exists' });
      });
  });
}