'use strict';

var app = require('../../server/app');
var config = require('../../server/config/environment');

var chai = require('chai');
var expect = chai.expect;

var User = require('../../server/api/user/user.model');
var BankAccount = require('../../server/api/bankaccount/bankaccount.model');
var Wallet = require('../../server/api/wallet/wallet.model');

var TestingUtils = require('../utils/testing_utils');

var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket');

var Utils = require('./../../server/utils/utils');


function seedBankAndUser(callback){
  BankAccount.create({
    name: 'ing',
    info: 'ING Bank',
    coldWallet: {
      address: 'r4gzWvzzJS2xLuga9bBc3XmzRMPH3VvxXg'
    },
    hotWallet : {
      address: 'rJXw6AVcwWifu2Cvhg8CLkBWbqUjYbaceu',
      secret: 'ssVbYUbUYUH8Yi9xLHceSUQo6XGm4'
    }
  }, function() {
    BankAccount.findOne(function (err, firstBank) {
      seedUsers(firstBank);
    });
  });

  function seedUsers(bank){
    var newUser = {
      provider: 'local',
      name: 'James Bond',
      email: 'james.bond@mi6.com',
      password: '1234',
      bank: bank._id
    };
    User.create(newUser, function() {
      callback(newUser, bank);
    });
  }
}

describe('ITest signup', function () {

  beforeEach(function(done){
    TestingUtils.dropMongodbDatabase().then(function(){
      done();
    });
  });

  it('should create an user', function (done) {
    seedBankAndUser(function(theUser){
      expect(theUser.email).to.eql('james.bond@mi6.com');
      done()
    });
  });

});
