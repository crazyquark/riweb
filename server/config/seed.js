/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var User = require('../api/user/user.model');
var Wallet = require('../api/wallet/wallet.model');
var BankAccount = require('../api/bankaccount/bankaccount.model');

BankAccount.find({}).remove(function() {
  BankAccount.create({
    name: 'ing',
    info: 'ING Bank',
    coldWallet: {
      address: 'r4gzWvzzJS2xLuga9bBc3XmzRMPH3VvxXg'
    },
    hotWallet : {
      address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
      secret: 'masterpassphrase'
    }
  },
  {
    name: 'abnamro',
    info: 'ABN Amro Bank',
    coldWallet: {
      address: ''
    },
    hotWallet: {
      address: '',
      secret: ''
    }
  }, function() {
      BankAccount.findOne(function (err, firstBank) {
          seedUsers(firstBank);
      });
    }
  );
});

function seedUsers(bank){
    User.find({}).remove(function() {
        User.create({
                provider: 'local',
                name: 'Test User',
                email: 'test@test.com',
                password: 'test',
                bank: bank._id
            }, {
                provider: 'local',
                role: 'admin',
                name: 'Admin',
                email: 'admin@admin.com',
                password: 'admin',
                bank: bank._id
            }, function() {
                // console.log('finished populating users');
            }
        );
    });
}

Wallet.find({}).remove().exec();
