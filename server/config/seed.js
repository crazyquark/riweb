/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Wallet = require('../api/wallet/wallet.model');
var CreateBank = require('../api/create_bank/create_bank.socket');
var CreateAdminUserForBank = require('../api/create_admin_user_for_bank/create_admin_user_for_bank.socket');

var TestingUtils = require('./../../test/utils/testing_utils');

var Q = require('q');

function createAdminIinfo(bankInfo){
  return {
    bankId: bankInfo._id,
    info: bankInfo.info,
    email: bankInfo.email,
    password: bankInfo.email
  };
}

function createBank(bank){
  return CreateBank.createBank(bank).then(function(bankInfo){
    CreateAdminUserForBank.createAdminUserForBank(createAdminIinfo(bankInfo));
  });
}

TestingUtils.dropMongodbDatabase().then(function () {
  var createBankA = createBank({
    name: 'alpha',
    info: 'Alpha Bank',
    email: 'admin@alpha.com',
    password: 'admin@alpha.com'
  });

  var createBankB = createBank({
    name: 'brd',
    info: 'BRD Societe Generale',
    email: 'admin@brd.com',
    password: 'admin@brd.com'
  });

  Q.all([createBankA, createBankB]);
});

//BankAccount.find({}).remove(function() {
//  BankAccount.create({
//    name: 'ing',
//    info: 'ING Bank',
//    email: 'admin@ing.com',
//    coldWallet: {
//      address: 'r4gzWvzzJS2xLuga9bBc3XmzRMPH3VvxXg'
//    },
//    hotWallet : {
//      address: 'rJXw6AVcwWifu2Cvhg8CLkBWbqUjYbaceu',
//      secret: 'ssVbYUbUYUH8Yi9xLHceSUQo6XGm4'
//    },
//  },
//  {
//    name: 'abnamro',
//    info: 'ABN Amro Bank',
//    email: 'admin@abnamro.com',
//    coldWallet: {
//      address: ''
//    },
//    hotWallet: {
//      address: '',
//      secret: ''
//    },
//  }, function() {
//      BankAccount.findOne(function (err, firstBank) {
//          seedUsers(firstBank);
//      });
//    }
//  );
//});
//
//function seedUsers(bank){
//    User.find({}).remove(function() {
//        User.create({
//                provider: 'local',
//                name: 'Test User',
//                email: 'test@test.com',
//                password: 'test',
//                bank: bank._id
//            }, {
//                provider: 'local',
//                role: 'admin',
//                name: 'Admin',
//                email: 'admin@admin.com',
//                password: 'admin',
//                bank: bank._id
//            }, function() {
//                // console.log('finished populating users');
//            }
//        );
//    });
//}
//
//Wallet.find({}).remove().exec();
