'use strict';

var app = require('../../server/app');

var chai = require('chai');
var expect = chai.expect;

var User = require('../../server/api/user/user.model');
var BankAccount = require('../../server/api/bankaccount/bankaccount.model');
var Wallet = require('../../server/api/wallet/wallet.model');

var TestingUtils = require('../utils/testing_utils');

var CreateWallet = require('../../server/api/create_wallet/create_wallet.socket');

var Utils = require('./../../server/utils/utils');

var debug = require('debug')('CreateWalletForUserSpec');


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
      callback(newUser);
    });
  }
}

describe('ITest signup', function () {

  beforeEach(function(done){
    this.timeout(10000);
    TestingUtils.dropMongodbDatabase().then(function(){
      
      //ugly hack for an integration test but hope it works
      CreateWallet.register(TestingUtils.buildSocketSpy());
      
      debug('dropMongodbDatabase');
      // TestingUtils.buildClientSocketIoConnection();      
      debug('buildClientSocketIoConnection');
      done();
    });
  });

  xit('should create an wallet for the user', function (done) {
    this.timeout(10000);
    seedBankAndUser(function(theUser){
      CreateWallet.createWalletForEmail(theUser.email).then(function() {
        Wallet.findByOwnerEmail(theUser.email).then(function(wallet){
          expect(wallet.ownerEmail).to.eql('james.bond@mi6.com');

          Utils.getNewConnectedRemote().then(function(remote){

            var options = {
              account: wallet.address,
              ledger: 'validated'
            };

            remote.requestAccountInfo(options, function(err, info) {
              expect(err).to.eql(null);
              expect(info).to.have.deep.property('account_data.Account', wallet.address);
              expect(info).to.have.deep.property('account_data.Balance', '60000000');
              done();
            })
          })
        })
      }).done(null, function (error) {done(error);});
    });
  });


});
