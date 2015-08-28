'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var io = require('socket.io');
var Q = require('q');
var expect = chai.expect;
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var CreateWallet = require('./create_wallet.socket');
var TestingUtils = require('./../../../test/utils/testing_utils');
var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');
var User = require('./../user/user.model');
var Bankaccount = require('./../bankaccount/bankaccount.model');

var debug = require('debug')('CreateWallet');

describe('Test create_wallet', function () {

    var nonAdminRippleGeneratedWallet, emitSpy, emitter;
    var bank1, bank2, nonAdminUser, nonAdminUserWithNoBank, stubs;

    beforeEach(function (done) {
        stubs = TestingUtils.buildGenericSetup();
        emitter = TestingUtils.buildNewClientEventEmitterSpy();
        emitSpy = emitter.emitEvent;

        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();

        bank1 = stubs.banks.bankA;
        bank2 = stubs.banks.bankB;
        nonAdminUser = stubs.users.alice;
        nonAdminUserWithNoBank = stubs.users.johndoe;

        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
      TestingUtils.restoreAll();
      emitSpy.restore();
    });

    it('should create non-root wallet for johndoe@a.com', function (done) {
        CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('johndoe@a.com'));
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function (error) {
          debug(error);
          done(error);
        });
    });

    it('should not create duplicate wallet for johndoe@a.com', function (done) {
        //let's use the real finder this time
        Wallet.findByOwnerEmail.restore();

        CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () {
            CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () {
                expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('johndoe@a.com'));
                expect(Wallet.create).to.have.callCount(1);
                done();
            });
        }).done(null, function (error) {
          debug(error);
          done(error);
        });
    });

    it('should set_trust when create new wallet', function (done) {
        CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () {
            expect(emitSpy).to.have.callCount(2);
            expect(emitSpy).to.have.been.calledWith('set_trust', {
                rippleDestinationAddr: stubs.banks.bankA.hotWallet.address,
                rippleSourceAddr: nonAdminRippleGeneratedWallet.address,
                rippleSourceSecret: nonAdminRippleGeneratedWallet.secret
            });
            expect(emitSpy).to.have.been.calledWith('post:create_wallet', {
                address: nonAdminRippleGeneratedWallet.address
            });
            done();
        }).done(null, function (error) { debug(error); done(error); });
    });

    it('should emit post:create_wallet flag when create new wallet', function (done) {
        CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () {
            //expect(emitSpy).to.have.callCount(2);
            expect(emitSpy).to.have.been.calledWith('set_trust', {
                rippleDestinationAddr: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh_BANK1',
                rippleSourceAddr: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
                rippleSourceSecret: 'NONADMINssphrase'
            });
            expect(emitSpy).to.have.been.calledWith('post:create_wallet', {
                address: sinon.match.string
            });
            done();
        }).done(null, function (error) { done(error); });
    });


    it('should fail when user does not have a bank', function (done) {
        CreateWallet.createWalletForEmail(emitter, 'johndoe@a.com').then(function () { done(); },
            function () {
                expect(emitSpy).to.have.callCount(1);
                expect(emitSpy).to.have.been.calledWith('post:create_wallet', {
                    error: "bank not found"
                });
                done();
            }
        ).done(null, function (error) { done(error); });
    });

    it('should fail when user is not found', function (done) {
        CreateWallet.createWalletForEmail(emitter, 'userDoesNotExist@nobody.com').then(function () { done(); },
            function () {
                expect(emitSpy).to.have.callCount(1);
                expect(emitSpy).to.have.been.calledWith('post:create_wallet', {
                    error: "user not found"
                });
                done();
            }
        ).done(null, function (error) { done(error); });
    });
});
