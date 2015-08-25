/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var Utils = require('./../../utils/utils');
var BankAccount = require('./../bankaccount/bankaccount.model');
var CreateWallet = require('../create_wallet/create_wallet.socket');
var SetTrust = require('../set_trust/set_trust.socket');

var debug = require('debug')('CreateBank');

var socket;

var ROOT_RIPPLE_ACCOUNT = Utils.ROOT_RIPPLE_ACCOUNT;

function createNewBank(newBank) {
  var newRippleAddress = ripple.Wallet.generate();

  var newBankAccount = {
    name: newBank.name,
    info: newBank.info,
    email: newBank.email,
    hotWallet: newRippleAddress
  };

  return BankAccount.createQ(newBankAccount);
}

function createBank(newBank) {
  var deferred = Q.defer();

  BankAccount.findOneQ({ name: newBank.name }).then(function (foundBank) {
    if (foundBank) {
      debug('Found existing bank', foundBank.name);
      deferred.reject(null);
    } else {
      debug('createNewBank', newBank);
      createNewBank(newBank).then(function (createdBank) {
        // Need to also fund this newly minted wallet
        // XXX need lots of XRP for banks to fund wallets
        CreateWallet.fundWallet(createdBank.hotWallet, ROOT_RIPPLE_ACCOUNT, 1000).then(function () {
          debug('funded bank wallet');
          // XXX should the funding be chained or should we return to user immediately? I'd rather not wait for the costly ripple operation
          // Utils.emitEvent('post:fund_wallet', createdBank.hotWallet);
          Utils.emitEvent('post:fund_wallet', {address: createdBank.hotWallet.address});
          
          // Establish trust lines with the other banks. Account must be funded.
          // XXX this is also made async after returning to the client so not to block the create bank page too long;
          // The client should listen for the emitted event
          SetTrust.setMutualBanksTrust(createdBank).then(function () {
            debug('setMutualBanksTrust done');
            Utils.emitEvent('post:set_mutual_banks_trust', { status: 'success' });
          });
        });

        Utils.emitEvent('create_admin_user_for_bank', {
          bankId: createdBank._id,
          info: createdBank.info,
          email: newBank.email,
          password: newBank.password,
        });

        debug('resolve create', createdBank.info);
        deferred.resolve(createdBank);

      });

    }
  });

  return deferred.promise;
}

exports.createBank = createBank;
exports.register = function(newSocket, clientEventEmitter) {
  socket = newSocket;

  Utils.forwardFromEventEmitterToSocket('post:fund_wallet', socket);
  Utils.forwardFromEventEmitterToSocket('post:set_mutual_banks_trust', socket);

  socket.on('create_bank', function (data) {
    createBank(data)
      .then(function (bank) {
         Utils.emitEvent('post:create_admin_user_for_bank', { status: 'success', bank: bank });
      })
      .fail(function (error) {
         Utils.emitEvent('post:create_admin_user_for_bank', { status: 'error', error: 'Bank already exists' });
      });
  });
};
