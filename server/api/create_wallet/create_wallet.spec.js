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

var adminMongooseWallet = {
  ownerEmail: "admin@admin.com",
  passphrase: "masterpassphrase",
  publicKey: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
};

var nonAdminMongooseWallet = {
  ownerEmail: "a1@example.com",
  passphrase: "NONADMINssphrase",
  publicKey: "rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh"
};

describe('Test create wallet', function () {
    var socket, remote, transaction;
    beforeEach(function () {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();

        ripple.Wallet.generate = sinon.stub().returns(nonAdminGeneratedWallet);

        transaction = {
          submit: sinon.stub()
        };

        transaction.submit.callsArgWith(0, null, {});

        remote = {
            connect: sinon.stub(),
            setSecret: sinon.stub(),
            createTransaction: sinon.stub()
        };
        remote.connect.callsArgWith(0, null);
        remote.createTransaction.returns(transaction);

        Utils.getNewRemote = sinon.stub().returns(remote);

        create_wallet.register(socket);
    });

    beforeEach(function () {
        sinon.spy(Wallet, "create");
        // sinon.spy(remote, "connect");
    });
    afterEach(function () {
       Wallet.create.restore();
      //  remote.connect.restore();
    });

    it('should create root wallet for admin@admin.com', function (done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function () {
            expect(Wallet.create).to.have.calledWith(adminMongooseWallet);
            expect(Wallet.create).to.have.callCount(1);
            // expect(Wallet.create).to.have.calledWith(nonAdminGeneratedWallet);
            done();
        }).done(null, function(error){done(error);});
    });

    it('should create non-root wallet for a1@example.com', function (done) {
      try{
        create_wallet.create_wallet_for_email('a1@example.com').then(function () {
          expect(Wallet.create).to.have.calledWith(nonAdminMongooseWallet);
          expect(Wallet.create).to.have.callCount(1);
          done();
        }).done(null, function (error) {done(error);});
      }catch (e){
        done(e);
      }
    });

    xit('should not create duplicate wallet for a1@example.com', function (done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function () {
            create_wallet.create_wallet_for_email('a1@example.com').then(function (newWallet) {
                expect(Wallet.create).to.have.calledWith(nonAdminMongooseWallet);
                expect(Wallet.create).to.have.callCount(1);
                done();
            }).done(null, function(error){done(error);})
        }).done(null, function(error){done(error);});
    });
});
