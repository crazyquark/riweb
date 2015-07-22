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

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy;

    beforeEach(function () {
        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        ripple.Wallet.generate = sinon.stub().returns(nonAdminRippleGeneratedWallet);

        CreateWallet.register(TestingUtils.buildSocketSpy());
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
    });

    beforeEach(function () {
        TestingUtils.buildWalletSpy();
        TestingUtils.buildNewConnectedRemoteStub();
    });
    afterEach(function () {
        TestingUtils.restoreWalletSpy();
        emitSpy.restore();
    });

    it('should create root wallet for admin@admin.com and call set_root_flags', function (done) {
        CreateWallet.createWalletForEmail('admin@admin.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getAdminMongooseWallet());
            expect(Wallet.create).to.have.callCount(1);
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('set_root_flags');
            done();
        }).done(null, function(error){done(error);});
    });

    it('should create non-root wallet for a1@example.com', function (done) {
        CreateWallet.createWalletForEmail('a1@example.com').then(function () {
          expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('a1@example.com'));
          expect(Wallet.create).to.have.callCount(1);
          done();
        }).done(null, function (error) {done(error);});
    });

    it('should not create duplicate wallet for a2@example.com', function (done) {
        CreateWallet.createWalletForEmail('a2@example.com').then(function() {
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

});
