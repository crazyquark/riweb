'use strict';

var sinon = require('sinon');
var app = require('../../app');
var create_wallet = require('./create_wallet.socket');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;
var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var Wallet = require('./../wallet/wallet.model');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var nonAdminGeneratedWallet = {
    address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
    secret: 'NONADMINssphrase'
};

describe('Test create wallet', function () {
    var socket, remote;
    beforeEach(function () {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();

        ripple.Wallet.generate = sinon.stub().returns(nonAdminGeneratedWallet);

        remote = {
            connect: sinon.spy(),
            setSecret: sinon.spy()
        };
        Utils.getNewRemote = sinon.stub().returns(remote);

        create_wallet.register(socket);
    });

    beforeEach(function () {
//        sinon.spy(Wallet, "create");
        sinon.spy(Wallet, "delete_this_function");
    });
    afterEach(function () {
//        Wallet.create.restore();
        Wallet.delete_this_function.restore();
    });

    it('should create root wallet for admin@admin.com', function (done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function (newWallet) {
            expect(newWallet.publicKey).to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
            done();
        }).done(null, function(error){done(error);});
    });

    it('should create non-root wallet for a1@example.com', function (done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function (newWallet) {
            expect(newWallet.publicKey).to.equal('rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh');
            done();
        }).done(null, function (error) {done(error);});
    });

    it('should not create duplicate wallet for a1@example.com', function (done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function () {
            create_wallet.create_wallet_for_email('a1@example.com').then(function (newWallet) {
                expect(Wallet.delete_this_function).to.have.callCount(2);
                expect(newWallet.publicKey).to.equal('rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh');
                done();
            }).done(null, function(error){done(error);})
        }).done(null, function(error){done(error);});
    });
});