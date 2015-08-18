/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Wallet = require('../api/wallet/wallet.model');
var CreateBank = require('../api/create_bank/create_bank.socket');
var CreateAdminUserForBank = require('../api/create_admin_user_for_bank/create_admin_user_for_bank.socket');
var CreateWallet = require('../api/create_wallet/create_wallet.socket');
var MakeTransfer = require('../api/make_transfer/make_transfer.socket');
var SetTrust = require('../api/set_trust/set_trust.socket');
var BankAccount = require('../api/bankaccount/bankaccount.socket');

var RealBankAccount = require('../api/RealBankAccount/RealBankAccount.model');

var TestingUtils = require('./../../test/utils/testing_utils');

var Q = require('q');

var debug = require('debug')('Seed');

function createRealbankUsers() {
  return RealBankAccount.create([{
    name: 'alpha',
    iban: 'AL47212110090000000235698741',
    ballance: '100'
  },
    {
      name: 'alpha',
      iban: 'AZ21NABZ00000000137010001944',
      ballance: '101'
    },
    {
      name: 'brd',
      iban: 'BA391290079401028494',
      ballance: '102'
    }]);

}

TestingUtils.dropMongodbDatabase().then(function () {
  var bankA = {
    name: 'alpha',
    info: 'Alpha Bank',
    email: 'admin@alpha.com',
    password: 'admin@alpha.com'
  };

  var bankB = {
    name: 'brd',
    info: 'BRD Societe Generale',
    email: 'admin@brd.com',
    password: 'admin@brd.com'
  };

  var aliceWallet;
  var createBankA = BankAccount.createBank(bankA).then(function (bankAdmin) {
    return BankAccount.createUserForBank({
      name: 'Alice',
      email: 'alice@alpha.com',
      iban: 'AL47212110090000000235698741'
    }, bankAdmin)
      .then(function (wallet) {
        aliceWallet = { address: wallet.address, secret: wallet.secret }; 
        
        return BankAccount.createUserForBank({
          name: 'Alan',
          email: 'alan@alpha.com',
          iban: 'AZ21NABZ00000000137010001944'
        }, bankAdmin);
      });
  });

  var createBankB = BankAccount.createBank(bankB).then(function (bankAdmin) {
    return BankAccount.createUserForBank({
      name: 'Bob',
      email: 'bob@brd.com',
      iban: 'BA391290079401028494'
    }, bankAdmin);
  });

  Q.all([createBankA, createBankB]).spread(function (alanWallet, bobWallet) {
    SetTrust.setBanksTrust(bankA.bankInfo.hotWallet, bankB.bankInfo.hotWallet, alanWallet, bobWallet).then(function () {
      debug('Set trust alan -> bankA <-> bankB <- bob');
      SetTrust.setTrust(bankA.bankInfo.hotWallet.address, aliceWallet.address, aliceWallet.secret).then(function () {
        debug('Set trust alice -> bankA');
        MakeTransfer.makeTransfer('admin@alpha.com', 'alan@alpha.com', 1000).then(function () {
          debug('admin@alpha.com -> alan@alpha.com: 1000 EUR');
        });
      });
    });
  });

  createRealbankUsers();

});

