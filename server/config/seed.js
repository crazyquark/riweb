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

var ClientEventEmitter = require('../utils/ClientEventEmitter/ClientEventEmitter.service');
var emitter = new ClientEventEmitter(null);

var RealBankAccount = require('../api/RealBankAccount/RealBankAccount.model');

var TestingUtils = require('./../../test/utils/testing_utils');

var Q = require('q');

var debug = require('debug')('Seed');
debug('Started seed.js');

function createAdminInfo(bankInfo) {
  return {
    bankId: bankInfo._id,
    info: bankInfo.info,
    email: bankInfo.email,
    password: bankInfo.email
  };
}

function createBank(bank) {
  return CreateBank.createBank(emitter, bank).then(function (bankInfo) {
  //return CreateBank.createBankAndUser(emitter, bank).then(function (bankInfo) {
    bank.bankInfo = bankInfo;
    return CreateAdminUserForBank.createAdminUserForBank(createAdminInfo(bankInfo), emitter);
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
    return CreateWallet.createWalletForEmail(emitter, newUser.email, 'user');
  });
}

function createRealbankUsers() {
  return RealBankAccount.create([{
    name: 'alpha',
    iban: 'AL47212110090000000235698741',
    balance: '100'
  },
    {
      name: 'alpha',
      iban: 'AZ21NABZ00000000137010001944',
      balance: '101'
    },
    {
      name: 'brd',
      iban: 'BA391290079401028494',
      balance: '102'
    },
    {
      name: 'delta',
      iban: 'DO28BAGR00000001212453611324',
      balance: '1000'
    },
    {
      name: 'pirreus',
      iban: 'MK07250120000058984',
      balance: '99'
    },

    ]);

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
    var createBankA = createBank(bankA).then(function (bankAdmin) {
        return createUserForBank({
            name: 'Alice',
            email: 'alice@alpha.com',
            iban: 'AL47212110090000000235698741'
        }, bankAdmin)
            .then(function (wallet) {
                aliceWallet = { address: wallet.address, secret: wallet.secret };

                return createUserForBank({
                    name: 'Alan',
                    email: 'alan@alpha.com',
                    iban: 'AZ21NABZ00000000137010001944'
                }, bankAdmin);
            });
    });

    var createBankB = createBank(bankB).then(function (bankAdmin) {
        return createUserForBank({
            name: 'Bob',
            email: 'bob@brd.com',
            iban: 'BA391290079401028494'
        }, bankAdmin);
    });

    var createRealbankUsersPromise = createRealbankUsers();

    Q.all([createBankA, createBankB, createRealbankUsersPromise]).spread(function (alanWallet, bobWallet) {
        debug('Q.all');
        SetTrust.setBanksTrust(bankA.bankInfo.hotWallet, bankB.bankInfo.hotWallet, alanWallet, bobWallet).then(function () {
            debug('Set trust alan -> bankA <-> bankB <- bob');
            SetTrust.setTrust(bankA.bankInfo.hotWallet.address, aliceWallet.address, aliceWallet.secret).then(function () {
                debug('Set trust alice -> bankA');
                MakeTransfer.makeTransfer(emitter, 'admin@alpha.com', 'alan@alpha.com', 101).then(function () {
                    debug('admin@alpha.com -> alan@alpha.com: 101 EUR');
                    debug('\n\n' +
                            '=======================================\n' +
                            '===========SERVER IS STARTED===========\n' +
                            '=======================================\n'
                    );
                });
            });
        });
    });

});

