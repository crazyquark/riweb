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

var RealBankAccount = require('../api/RealBankAccount/RealBankAccount.model');

var TestingUtils = require('./../../test/utils/testing_utils');

var Q = require('q');

var debug = require('debug')('Seed');

function createAdminInfo(bankInfo){
  return {
    bankId: bankInfo._id,
    info: bankInfo.info,
    email: bankInfo.email,
    password: bankInfo.email
  };
}

function createBank(bank){
  return CreateBank.createBank(bank).then(function(bankInfo){
    return CreateAdminUserForBank.createAdminUserForBank(createAdminInfo(bankInfo));
  });
}

function createUserForBank(user, bankAdmin){
  return User.create({
    provider: 'local',
    name: user.name,
    email: user.email,
    password: user.email,
    iban: user.iban,
    bank: bankAdmin.bank
  }).then(function(newUser){
    return CreateWallet.createWalletForEmail(newUser.email, 'user');
  });
}

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
  var createBankA = createBank({
    name: 'alpha',
    info: 'Alpha Bank',
    email: 'admin@alpha.com',
    password: 'admin@alpha.com'
  }).then(function(bankAdmin){
    return createUserForBank({
          name: 'Alice',
          email: 'alice@alpha.com',
          iban: 'AL47212110090000000235698741'
      }, bankAdmin)
      .then(function(){
        return createUserForBank({
          name: 'Alan',
          email: 'alan@alpha.com',
          iban: 'AZ21NABZ00000000137010001944'
        }, bankAdmin);
      });
  });

  var createBankB = createBank({
    name: 'brd',
    info: 'BRD Societe Generale',
    email: 'admin@brd.com',
    password: 'admin@brd.com'
  }).then(function(bankAdmin){
    return createUserForBank({
      name: 'Bob',
      email: 'bob@brd.com',
      iban: 'BA391290079401028494'
    }, bankAdmin);
  });

  Q.all([createBankA, createBankB]).then(function(){
    //SetTrust.setBanksTrust(bank1, bank2, user1, user2)
    //MakeTransfer.makeTransfer('admin@alpha.com', 'alice@alpha.com', 101);
  });

  createRealbankUsers();

});

