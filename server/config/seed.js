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

var TestingUtils = require('./../../test/utils/testing_utils');

var Q = require('q');

var debug = require('debug')('Seed');

function createAdminInfo(bankInfo) {
  return {
    bankId: bankInfo._id,
    info: bankInfo.info,
    email: bankInfo.email,
    password: bankInfo.email
  };
}

function createBank(bank) {
  return CreateBank.createBank(bank).then(function (bankInfo) {
    bank.bankInfo = bankInfo;
    return CreateAdminUserForBank.createAdminUserForBank(createAdminInfo(bankInfo));
  });
}

function createUserForBank(user, bankAdmin) {
  return User.create({
    provider: 'local',
    name: user.name,
    email: user.email,
    password: user.email,
    iban: user.iban,
    bank: bankAdmin.bank
  }).then(function (newUser) {
    return CreateWallet.createWalletForEmail(newUser.email, 'user');
  });
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
  
  var createBankA = createBank(bankA).then(function (bankAdmin) {
    return createUserForBank({
      name: 'Alice',
      email: 'alice@alpha.com',
      iban: 'AL47212110090000000235698741'
    }, bankAdmin)
      .then(function () {
        return createUserForBank({
          name: 'Alan',
          email: 'alan@alpha.com',
          iban: 'AZ21NABZ00000000137010001944'
        }, bankAdmin);
      });
  })

  var createBankB = createBank(bankB).then(function (bankAdmin) {
    return createUserForBank({
      name: 'Bob',
      email: 'bob@brd.com',
      iban: 'BA391290079401028494'
    }, bankAdmin);
  });

  Q.all([createBankA, createBankB]).spread(function (user1Wallet, user2Wallet) {
    SetTrust.setBanksTrust(bankA.bankInfo.hotWallet, bankB.bankInfo.hotWallet, user1Wallet, user2Wallet).then(function () {
      debug('Set trust bankA <-> bankB and user1, user2');
      MakeTransfer.makeTransfer('admin@alpha.com', 'alan@alpha.com', 101).then(function(){
        debug('admin@alpha.com -> alan@alpha.com: 101 EUR');
      });
    });
  });
});

