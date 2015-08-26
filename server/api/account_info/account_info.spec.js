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
var AccountInfo = require('./account_info.socket');
var TestingUtils = require('./../../../test/utils/testing_utils');
var ClientEventEmitter = require('../../utils/ClientEventEmitter/ClientEventEmitter.service');

describe('Test account_info', function () {
    var emitSpy, emitter;
    beforeEach(function (done) {
        TestingUtils.buildRippleWalletGenerateForNonAdmin();
        emitter = TestingUtils.buildNewClientEventEmitterSpy();
        emitSpy = emitter.emitEvent;

        AccountInfo.register(emitter);

        TestingUtils.buildNewConnectedRemoteStub();
        TestingUtils.buildWalletSpy();
        TestingUtils.dropMongodbDatabase().then(function () { done(); });
    });
    afterEach(function () {
        TestingUtils.restoreAll();
    });

    it('should get account_info for unexisting email', function (done) {
        TestingUtils.buildFindByOwnerEmailForUnexisting(Wallet);

        AccountInfo.getAccountInfo('not_exist@example.com', emitter).then(function () {
            expect(emitSpy).to.have.been.calledWith('post:account_info', { info: 'User does not exist!'});
            expect(emitSpy).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should get account_info for admin email', function (done) {
        TestingUtils.buildFindByOwnerEmailForAdmin(Wallet);

        AccountInfo.getAccountInfo('admin@admin.com', emitter).then(function () {
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('post:account_info', { balance: 0});
            done();
        }).done(null, function (error) { done(error); });
    });

});
