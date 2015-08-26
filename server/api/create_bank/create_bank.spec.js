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

    var nonAdminRippleGeneratedWallet, adminMongooseWallet, emitSpy, socketSpy, emitter;

    beforeEach(function (done) {
        var socket = TestingUtils.buildSocketSpy();

        nonAdminRippleGeneratedWallet = TestingUtils.getNonAdminRippleGeneratedWallet();
        adminMongooseWallet = TestingUtils.getAdminMongooseWallet();
        TestingUtils.buildRippleWalletGenerateForNonAdmin();

        socketSpy = TestingUtils.buildSocketSpy();
        emitter = TestingUtils.buildNewClientEventEmitterSpy(socketSpy);
        CreateBank.register(socketSpy, emitter);
        emitSpy = emitter.emit;

        // socket.id = 'fooBarSocketId';
        // Utils.setSocketId(socket.id);
        // Utils.putSocket(socket);

        TestingUtils.buildBankaccountSpy();
        TestingUtils.buildNewConnectedRemoteStub();
        TestingUtils.dropMongodbDatabase().then(function () { done(); });
    });
    afterEach(function () {
        emitSpy.restore();
        TestingUtils.restoreAll();
    });

    it('should create new account for a bank', function (done) {
        var newBank = {
            name: 'brd',
            info: 'The french one',
            email: 'admin@brd.com',
        };
        CreateBank.createBank(emitter, newBank).then(function () {
            expect(Bankaccount.create).to.have.been.calledWith({
                name: 'brd',
                info: 'The french one',
                email: 'admin@brd.com',
                hotWallet: nonAdminRippleGeneratedWallet
            });
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should emit 2 events after a bank has been created', function (done) {
        var newBank = {
            name: 'brd',
            info: 'The french one',
            email: 'admin@brd.com',
            password: 'secret',
        };
        CreateBank.createBank(emitter, newBank).then(function (createdBank) {
            expect(emitSpy).to.have.been.calledWith('create_admin_user_for_bank', {
                bankId: createdBank._id,
                info: createdBank.info,
                email: 'admin@brd.com',
                password: 'secret',
            });
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should fail to create same account again for a bank', function (done) {
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

        CreateBank.createBank(emitter, newBank)
            .then(function () {
                return CreateBank.createBank(emitter, newBankAgain);
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
