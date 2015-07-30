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


describe('Test create_bank', function () {

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy, socketSpy;

    beforeEach(function () {
        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        TestingUtils.buildRippleWalletGenerateForNonAdmin();

        socketSpy = TestingUtils.buildSocketSpy();
        CreateBank.register(socketSpy);
        emitSpy = sinon.spy(Utils.getEventEmitter(), 'emit');
    });

    beforeEach(function () {
        TestingUtils.buildBankaccountSpy();
        TestingUtils.buildNewConnectedRemoteStub();
    });
    afterEach(function (done) {
        TestingUtils.restoreAll();
        emitSpy.restore();
        TestingUtils.dropMongodbDatabase().then(function () { done(); });
    });

    it('should create new account for a bank', function (done) {
        var newBank = {
            name: 'brd',
            info: 'The french one',
            email: 'admin@brd.com'
        };
        CreateBank.createBank(newBank).then(function () {
            expect(Bankaccount.create).to.have.been.calledWith({
                name: 'brd',
                info: 'The french one',
                hotWallet: nonAdminRippleGeneratedWallet
            });
            expect(Bankaccount.create).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

    it.only('should fail to create same account again for a bank', function (done) {
        var newBank = {
            name: 'bcr',
            info: 'dummy BCR bank',
            email: 'admin@bcr.com',
        };
        var newBankAgain = {
            name: 'bcr',
            info: 'dummy BCR bank (2nd time)',
            email: 'admin@bcr.com'
        };

        CreateBank.createBank(newBank)
            .then(function () {
                return CreateBank.createBank(newBankAgain);
            })
            .then(function(data) {
                
            })
            .fail(function (bank) {
                expect(Bankaccount.create).to.have.callCount(1);
                expect(bank).to.eql(null);
                done();
            })
            .done(null, function (error) {
                done(error);
            });
    });
});
