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

  it.only('should create an wallet for the user', function (done) {
    this.timeout(10000);
    //TODO: should first send rippled credits to the bank (create bank wallet)
    debug('should create an wallet1');
    TestingUtils.seedBankAndUser(function(theUser){
      debug('should create an wallet2');
      CreateWallet.createWalletForEmail(theUser.email).then(function() {
        debug('should create an wallet3');
        Wallet.findByOwnerEmail(theUser.email).then(function(wallet){
          debug('should create an wallet4');
          expect(wallet.ownerEmail).to.eql('james.bond@mi6.com');

          debug('should create an wallet5');
          Utils.getNewConnectedRemote().then(function(remote){
            debug('should create an wallet6');

            var options = {
              account: wallet.address,
              ledger: 'validated'
            };

            debug('remote.requestAccountInfo', options);
            remote.requestAccountInfo(options, function(err, info) {
              debug('should create an wallet7');
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
