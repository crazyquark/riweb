'use strict';

var sinon = require('sinon');
var app = require('../../app');
var create_wallet = require('./create_wallet.socket');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;
var assert = chai.assert;
var ripple = require('ripple-lib');
var Utils = require('./../../core/utils');
var mongoose = require('mongoose');
var Wallet = require('./../wallet/wallet.model');

var nonAdminGeneratedWallet = {
    address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
    secret: 'NONADMINssphrase'
};

describe('Test create wallet', function() {
    var socket, remote, transaction;
    beforeEach(function() {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();

        ripple.Wallet.generate = sinon.stub().returns(nonAdminGeneratedWallet);

        remote = {
            connect: sinon.stub(),
            createTransaction: sinon.stub(),
            setSecret: sinon.spy()
        };

        transaction = {
            submit: sinon.stub()
        };

        // Fake remote functions
        remote.connect.callsArgWith(0, null);
        remote.createTransaction.returns(transaction);

        // Fake transaction functions
        transaction.submit.callsArgWith(0, null, {}); // err, res are the params

        Utils.getNewRemote = sinon.stub().returns(remote);

        create_wallet.register(socket);
    });

    it('should create root wallet for admin@admin.com', function(done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function(newWallet){
            expect(newWallet.publicKey).to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
            done();
        });
    });

    it('should create non-root wallet for a1@example.com', function(done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function(newWallet){
            expect(newWallet.publicKey).to.equal('rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh');
            done();
        });
    });

    it.only('should not create wallet multiple times', function(done) {
        create_wallet.create_wallet_for_email('duplicate@duplicate.com').then(function(newWallet){
          expect(newWallet.publicKey).to.equal('rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh');
          create_wallet.create_wallet_for_email('duplicate@duplicate.com').then(function(newWallet){
              expect(newWallet).to.equal(null);
              done();
          });
        });
    });

    it('should not create wallet for null email', function(done) {
        create_wallet.create_wallet_for_email(null).then(function(newWallet){
            expect(newWallet).to.equal(null);
            done();
        });
    });
});
