'use strict';

var should = require('should');
var sinon = require('sinon');
var app = require('../../app');
var create_wallet = require('./create_wallet.socket');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;
var ripple = require('ripple-lib');

var nonAdminGeneratedWallet = {
    address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
    secret: 'NONADMINssphrase'
};

describe('Test create wallet', function() {
    var socket;
    beforeEach(function() {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();

        var nonAdminCallback = sinon.stub().returns(nonAdminGeneratedWallet);
        ripple.Wallet.generate = nonAdminCallback;

        create_wallet.register(socket);
    });

    it('should create root wallet for admin@admin.com', function(done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function(newWallet){
//            console.log('before');
            expect(newWallet.publicKey).to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
//            expect(newWallet.publicKey).to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh ');
//            console.log('after');
            done();
        });
    });

    it('should create non-root wallet for a1@example.com', function(done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function(newWallet){
            expect(newWallet.publicKey).to.equal('rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh');
            done();
        });
    });

});