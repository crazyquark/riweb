'use strict';

var should = require('should');
var sinon = require('sinon');
var app = require('../../app');
var create_wallet = require('./create_wallet.socket');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;

xdescribe('Test create wallet', function() {
    var socket;
    beforeEach(function() {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();
        create_wallet.register(socket);
    });

    xit('should create root wallet for admin@admin.com', function(done) {
        create_wallet.create_wallet_for_email('admin@admin.com').then(function(newWallet){
//            console.log('newWallet=');
//            console.log(newWallet);
            setTimeout(function(){
//                socket.on('foo', spy);
//                emitter.emit('foo', 'bar', 'baz');
//                sinon.assert.calledOnce(socket.emit);
                sinon.assert.calledWith(socket.emit, 'post:create_wallet', null, newWallet.publicKey);

                expect(newWallet.publicKey).to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
                done();
            }, 50);
        });
    });

    it('should create non-root wallet for a1@example.com', function(done) {
        create_wallet.create_wallet_for_email('a1@example.com').then(function(newWallet){
            console.log('newWallet=');
            console.log(newWallet);
            setTimeout(function(){
                expect(newWallet.publicKey).not.to.equal('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
                done();
            }, 50);
        });
    });

});