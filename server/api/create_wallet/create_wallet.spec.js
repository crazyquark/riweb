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

describe('Test create_wallet', function () {

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy, socketSpy;

    beforeEach(function () {
        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        TestingUtils.buildRippleWalletGenerateForNonAdmin();

        socketSpy = TestingUtils.buildSocketSpy();
        CreateWallet.register(socketSpy);
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
        
        bank1 = Utils.getMongooseBankAccount('_bank1', 'Test bank #1', Utils.getNonAdminMongooseWallet('dumy@nothing.com', '_BANK1'));
        bank2 = Utils.getMongooseBankAccount('_bank2', 'Test foreing bank', Utils.getNonAdminMongooseWallet('dumy@nothing.com', '_BANK_FOREIGN'));
        nonAdminUser = TestingUtils.getNonAdminMongooseUser('Alice', 'alice@example.com', bank1._id);
        
        
        sinon.stub(User, 'findByEmail', function (email) {
            if (email === 'admin@admin.com') {
                return Q([nonAdminUser]); //TODO: should no longer be needed, since Admins will not have special wallets anymore 
            } else if (email === 'a1@example.com' || email === 'a2@example.com' || email === 'a3@example.com' || email === 'a4@example.com') {
                return Q([nonAdminUser]);
            }
            return Q([]);
        });
        
        sinon.stub(Bankaccount, 'findById', function (bankId) {
            if (bankId === bank1._id) {
                return Q([bank1]); 
            } else if (baId === bank2._id) {
                return Q([bank2]);
            }
            return Q([]);
        });        
    });

    beforeEach(function () {
        TestingUtils.buildWalletSpy();
        TestingUtils.buildNewConnectedRemoteStub();
    });
    afterEach(function (done) {
      TestingUtils.restoreAll();
      emitSpy.restore();
      TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    it('should create root wallet for admin@admin.com', function (done) {
        CreateWallet.createWalletForEmail('admin@admin.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getAdminMongooseWallet());
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

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
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('set_trust', {
                rippleDestinationAddr: adminMongooseWallet.address,
                rippleSourceAddr: nonAdminRippleGeneratedWallet.address,
                rippleSourceSecret: nonAdminRippleGeneratedWallet.secret
            });
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should set root flag when create new admin@admin.com wallet', function (done) {
        CreateWallet.createWalletForEmail('admin@admin.com').then(function () {
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('set_root_flags', {});
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should emit post:create_wallet flag when create new wallet', function (done) {
        CreateWallet.createWalletForEmail('a5@admin.com').then(function () {
            expect(socketSpy.emit).to.have.callCount(1);
            expect(socketSpy.emit).to.have.been.calledWith('post:create_wallet', sinon.match.string);
            done();
        }).done(null, function (error) { done(error); });
    });
});
