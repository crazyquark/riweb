'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var io = require('socket.io');
var expect = chai.expect;
var ripple = require('ripple-lib');
var Q = require('q');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');
var account_info = require('./account_info.socket');

function findByOwnerEmailForAdmin(Wallet){
    sinon.stub(Wallet, "findByOwnerEmail").returns(Q.resolve([{
        ownerEmail: "admin@admin.com",
        passphrase: "masterpassphrase",
        publicKey: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
    }]));
}

function findByOwnerEmailForUnexisting(Wallet){
    sinon.stub(Wallet, "findByOwnerEmail").returns(Q.resolve([]));
}


describe('Test account_info', function () {
    var socket, remote, transaction;
    beforeEach(function () {
        socket = {};
        socket.emit = sinon.spy();
        socket.on = sinon.spy();

        transaction = {
          submit: sinon.stub()
        };
        transaction.submit.callsArgWith(0, null, {});

        remote = {
            connect: sinon.stub(),
            setSecret: sinon.stub(),
            createTransaction: sinon.stub(),
            requestAccountLines: sinon.stub()
        };
        remote.connect.callsArgWith(0, null);
        remote.createTransaction.returns(transaction);
        remote.requestAccountLines.callsArgWith(1, null, {lines:[]});

        Utils.getNewConnectedRemote = sinon.stub().returns(Q.resolve(remote));

        account_info.register(socket);
    });

    beforeEach(function () {
        sinon.spy(Wallet, "create");
    });
    afterEach(function () {
       Wallet.create.restore();
       Wallet.findByOwnerEmail.restore();
    });

    it('should get account_info for unexisting email', function (done) {
        findByOwnerEmailForUnexisting(Wallet);

        account_info.get_account_info('not_exist@example.com', socket).then(function () {
            expect(socket.emit).to.have.calledWith('post:account_info', {info: 'User does not exist!'});
            expect(socket.emit).to.have.callCount(1);
            done();
        }).done(null, function(error){done(error);});
    });

    it('should get account_info for admin email', function (done) {
        findByOwnerEmailForAdmin(Wallet);
        account_info.get_account_info('admin@admin.com', socket).then(function () {
            expect(socket.emit).to.have.callCount(1);
            expect(socket.emit).to.have.calledWith('post:account_info', {balance: 0});
            done();
        }).done(null, function(error){done(error);});
    });

});
