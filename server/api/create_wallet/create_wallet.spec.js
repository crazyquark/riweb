'use strict';

var sinon = require('sinon');
var app = require('../../app');
var create_wallet = require('./create_wallet.socket');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var TestingUtils = require('./../../../test/utils/testing_utils');
var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');

describe('Test create_wallet', function () {

    var socket, remote;

    beforeEach(function () {
        socket = TestingUtils.buildSocketSpy();

        ripple.Wallet.generate = sinon.stub().returns(TestingUtils.getNonAdminRippleGeneratedWallet());

        remote = TestingUtils.buildRemoteStub();
        Utils.getNewRemote = sinon.stub().returns(remote);

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
});
