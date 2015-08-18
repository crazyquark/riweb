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

describe('Test create_wallet', function () {

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy;
    var bank1, bank2, nonAdminUser, nonAdminUserWithNoBank;

    beforeEach(function (done) {
        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        TestingUtils.buildRippleWalletGenerateForNonAdmin();

        CreateWallet.register(TestingUtils.buildSocketSpy());
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');

        bank1 = TestingUtils.getMongooseBankAccount('_bank1', 'Test bank #1', TestingUtils.getNonAdminMongooseWallet('dumy@nothing.com', '_BANK1'));
        bank2 = TestingUtils.getMongooseBankAccount('_bank2', 'Test foreing bank', TestingUtils.getNonAdminMongooseWallet('dumy@nothing.com', '_BANK_FOREIGN'));
        nonAdminUser = TestingUtils.getNonAdminMongooseUser('Alice', 'alice@example.com', bank1._id);
        nonAdminUserWithNoBank = TestingUtils.getNonAdminMongooseUser('NoBank', 'no_bank@example.com', '#_no_id#');

        TestingUtils.buildUserFindEmailStub(User, nonAdminUser);
        TestingUtils.buildBankaccountFindById(Bankaccount, [bank1, bank2]);

        TestingUtils.buildWalletSpy();
        TestingUtils.buildNewConnectedRemoteStub();
        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
      TestingUtils.restoreAll();
      emitSpy.restore();

      User.findByEmail.restore();
      Bankaccount.findById.restore();
    });

/*
    //Tests for Admin users wallets don't make sense anymore
    it('should create root wallet for admin@admin.com', function (done) {
        CreateWallet.createWalletForEmail('admin@admin.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getAdminMongooseWallet());
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });
*/

    it('should create non-root wallet for a1@example.com', function (done) {
        CreateWallet.createWalletForEmail('a1@example.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('a1@example.com'));
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should not create duplicate wallet for a2@example.com', function (done) {
        CreateWallet.createWalletForEmail('a2@example.com').then(function () {
            CreateWallet.createWalletForEmail('a2@example.com').then(function () {
                expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('a2@example.com'));
                expect(Wallet.create).to.have.callCount(1);
                done();
            });
        }).done(null, function (error) { done(error); });
    });

    it('should set_trust when create new wallet', function (done) {
        CreateWallet.createWalletForEmail('a3@example.com').then(function () {
            expect(emitSpy).to.have.callCount(2);
            expect(emitSpy).to.have.been.calledWith('set_trust', {
                rippleDestinationAddr: bank1.hotWallet.address,
                rippleSourceAddr: nonAdminRippleGeneratedWallet.address,
                rippleSourceSecret: nonAdminRippleGeneratedWallet.secret
            });
            expect(emitSpy).to.have.been.calledWith('post:create_wallet', nonAdminRippleGeneratedWallet.address);
            done();
        }).done(null, function (error) { done(error); });
    });

    /*
        //Tests for Admin users wallets don't make sense anymore
        it('should set root flag when create new admin@admin.com wallet', function (done) {
            CreateWallet.createWalletForEmail('admin@admin.com').then(function () {
                expect(emitSpy).to.have.callCount(1);
                expect(emitSpy).to.have.been.calledWith('set_root_flags', {});
                done();
            }).done(null, function (error) { done(error); });
        });
    */

    it('should emit post:create_wallet flag when create new wallet', function (done) {
        CreateWallet.createWalletForEmail('a5@example.com').then(function () {
            expect(emitSpy).to.have.callCount(2);
            expect(emitSpy).to.have.been.calledWith('post:create_wallet', sinon.match.string);
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should fail when user does not have a bank', function (done) {
        //replace the generic 'good'  stub with an invalid user stub
        User.findByEmail.restore();
        TestingUtils.buildUserFindEmailStub(User, nonAdminUserWithNoBank);

        CreateWallet.createWalletForEmail(nonAdminUserWithNoBank.email).then(function () { done(); },
            function () {
                expect(emitSpy).to.have.callCount(1);
                expect(emitSpy).to.have.been.calledWith('post:create_wallet', { error: "bank not found"});
                done();
            }
        ).done(null, function (error) { done(error); });
    });

    it('should fail when user is not found', function (done) {
        CreateWallet.createWalletForEmail('userDoesNotExist@nobody.com').then(function () { done(); },
            function () {
                expect(emitSpy).to.have.callCount(1);
                expect(emitSpy).to.have.been.calledWith('post:create_wallet', { error: "user not found"});
                done();
            }
        ).done(null, function (error) { done(error); });
    });
});
