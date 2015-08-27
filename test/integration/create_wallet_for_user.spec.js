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

describe('ITest create wallet for user', function () {
  var emitter;

  beforeEach(function (done) {
    emitter = TestingUtils.buildNewClientEventEmitterSpy();

    this.timeout(10000);
    TestingUtils.dropMongodbDatabase().then(function () {

      //ugly hack for an integration test but hope it works
      CreateWallet.register(emitter);

      debug('dropMongodbDatabase');
      done();
    });
  });

  it('should create an wallet for the user', function (done) {
    this.timeout(40000); // Wait around a bunch for Ripple
    //TODO: should first send rippled credits to the bank (create bank wallet)
    //try to use what is in seed.js and extract it into a separate service
    debug('should create a wallet');
    TestingUtils.seedBankAndUser(emitter, function (theUser, theBank) {
      debug('seedBankAndUser');
      CreateWallet.fundWallet(emitter, theBank.hotWallet, Utils.ROOT_RIPPLE_ACCOUNT).then(function () {
        debug('fundWallet');
        CreateWallet.createWalletForEmail(emitter, theUser.email).then(function () {
          debug('createWalletForEmail');
          Wallet.findByOwnerEmail(theUser.email).then(function (wallet) {
            debug('findByOwnerEmail');
            expect(wallet.ownerEmail).to.eql('james.bond@mi6.com');

            debug('call getNewConnectedRemote');
            Utils.getNewConnectedRemote().then(function (remote) {
              debug('getNewConnectedRemote');

              var options = {
                account: wallet.address,
                ledger: 'validated'
              };

              debug('remote.requestAccountInfo', options);
              remote.requestAccountInfo(options, function (err, info) {
                debug('requestAccountInfo');
                expect(err).to.eql(null);
                expect(info).to.have.deep.property('account_data.Account', wallet.address);
                expect(info).to.have.deep.property('account_data.Balance', '59999988');
                done();
              })
            })
          })
        })
      }).done(null, function (error) { done(error); });
    });
  });


});
