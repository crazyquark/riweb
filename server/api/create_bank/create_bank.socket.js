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

function createBank(clientEventEmitter, newBank) {
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
        CreateWallet.fundWallet(clientEventEmitter, createdBank.hotWallet, ROOT_RIPPLE_ACCOUNT, 1000).then(function () {
          debug('funded bank wallet');
          // XXX should the funding be chained or should we return to user immediately? I'd rather not wait for the costly ripple operation
          // emitter.emit('post:fund_wallet', {address: createdBank.hotWallet.address});

          // Establish trust lines with the other banks. Account must be funded.
          // XXX this is also made async after returning to the client so not to block the create bank page too long;
          // The client should listen for the emitted event
          SetTrust.setMutualBanksTrust(createdBank).then(function () {
            debug('setMutualBanksTrust done');
            // emitter.emit('post:set_mutual_banks_trust', { status: 'success' });
          });
        });

        debug('resolve create', createdBank.info);
        deferred.resolve(createdBank);

      });

    }
  });

  return deferred.promise;
}

function createBankAndUser(clientEventEmitter, data) {
  return createBank(clientEventEmitter, data)
    .then(function (bank) {
      clientEventEmitter.emitEvent('create_admin_user_for_bank', {
        bankId: bank._id,
        info: bank.info,
        email: bank.email,
        password: data.password,
      });

      clientEventEmitter.emitEvent('post:create_admin_user_for_bank', { status: 'success', bank: bank });
      return bank;
    }).fail(function (error) {
      clientEventEmitter.emitEvent('post:create_admin_user_for_bank', { status: 'error', error: 'Bank already exists' });
      return Q.reject(error);
    });
}

//why are we using createBank again? we should be using createBankAndUser and deprecate createBank
exports.createBank = createBank;
exports.createBankAndUser = createBankAndUser;
exports.register = function (clientEventEmitter) {

  clientEventEmitter.forwardFromEventEmitterToSocket('post:fund_wallet');
  clientEventEmitter.forwardFromEventEmitterToSocket('post:set_mutual_banks_trust');

  clientEventEmitter.onSocketEvent('create_bank', function (data) {
    createBankAndUser(clientEventEmitter, data);
  });

};
