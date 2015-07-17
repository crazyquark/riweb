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

var create_wallet = require('./create_wallet.socket');
var TestingUtils = require('./../../../test/utils/testing_utils');
var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

describe('Test create_wallet', function () {

    var socket, remote, nonAdminRippleGeneratedWallet, adminMongooseWallet;

    beforeEach(function () {
        socket = TestingUtils.buildSocketSpy();

        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        ripple.Wallet.generate = sinon.stub().returns(nonAdminRippleGeneratedWallet);

        remote = TestingUtils.buildRemoteStub();
        Utils.getNewConnectedRemote = sinon.stub().returns(Q.resolve(remote));

        create_wallet.register(socket);
    });

    beforeEach(function () {
        sinon.spy(Wallet, "create");
    });
    afterEach(function () {
        Wallet.create.restore();
    });

    it('should create root wallet for admin@admin.com', function (done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function () {
            expect(Wallet.create).to.have.calledWith(TestingUtils.getAdminMongooseWallet());
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function(error){done(error);});
    });

    it('should create non-root wallet for a1@example.com', function (done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function () {
          expect(Wallet.create).to.have.calledWith(TestingUtils.getNonAdminMongooseWallet('a1@example.com'));
          expect(Wallet.create).to.have.callCount(1);
          done();
        }).done(null, function (error) {done(error);});
    });

    it('should not create duplicate wallet for a2@example.com', function (done) {
        create_wallet.create_wallet_for_email('a2@example.com').then(function () {
            create_wallet.create_wallet_for_email('a2@example.com').then(function () {
                expect(Wallet.create).to.have.calledWith(TestingUtils.getNonAdminMongooseWallet('a2@example.com'));
                expect(Wallet.create).to.have.callCount(1);
                done();
            }).done(null, function(error){done(error);})
        }).done(null, function(error){done(error);});
    });

    it('should set_trust when create new wallet', function (done) {
        var emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');

        create_wallet.create_wallet_for_email('a3@example.com').then(function () {
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.calledWith('set_trust', {
                rippleDestinationAddr: adminMongooseWallet.publicKey,
                rippleSourceAddr: nonAdminRippleGeneratedWallet.address,
                rippleSourceSecret: nonAdminRippleGeneratedWallet.secret
            });
            done();
        }).done(null, function(error){done(error);});
    });
});
