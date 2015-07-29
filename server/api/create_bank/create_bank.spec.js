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

var TestingUtils = require('./../../../test/utils/testing_utils');
var Utils = require('./../../utils/utils');
var Wallet = require('./../wallet/wallet.model');
var Bankaccount = require('./../bankaccount/bankaccount.model');

var CreateBank = require('./create_bank.socket');


describe('Test create_bank', function() {

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy, socketSpy;

    beforeEach(function () {
        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        ripple.Wallet.generate = sinon.stub().returns(nonAdminRippleGeneratedWallet);

        socketSpy = TestingUtils.buildSocketSpy();
        CreateBank.register(socketSpy);
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
    });

    beforeEach(function () {
        TestingUtils.buildBankaccountSpy();
        TestingUtils.buildNewConnectedRemoteStub();
    });
    afterEach(function () {
        TestingUtils.restoreWalletSpy();
        emitSpy.restore();
    });

    afterEach(function (done) {
        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    it('should create new account for a bank', function (done) {
        var newBank = {
          name: 'brd',
          info: 'The french one'
        };
        CreateBank.createBank(newBank).then(function () {
            expect(Bankaccount.create).to.have.been.calledWith({
                name: 'brd',
                info: 'The french one',
                hotWallet : nonAdminRippleGeneratedWallet
            });
            expect(Bankaccount.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

    xit('should create non-root wallet for a1@example.com', function (done) {
        CreateWallet.createWalletForEmail('a1@example.com').then(function () {
            expect(Wallet.create).to.have.been.calledWith(TestingUtils.getNonAdminMongooseWallet('a1@example.com'));
            expect(Wallet.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });
});