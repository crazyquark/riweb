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
    });

    beforeEach(function () {
        TestingUtils.buildWalletSpy();
        TestingUtils.buildNewConnectedRemoteStub();
    });
    afterEach(function () {
        TestingUtils.restoreWalletSpy();
        emitSpy.restore();
        TestingUtils.restoreRippleWalletGenerate();
    });

    afterEach(function (done) {
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
