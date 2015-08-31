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
        var stubs = TestingUtils.buildGenericSetup();
        //TestingUtils.buildRippleWalletGenerateForNonAdmin();
        emitter = stubs.emitter;
        emitSpy = emitter.emitEvent;

        TestingUtils.dropMongodbDatabase().then(function () { done(); });
    });
    afterEach(function () {
        TestingUtils.restoreAll();
    });

    it('should get account_info for unexisting email', function (done) {
        Wallet.findByEmail.restore();
        TestingUtils.buildFindByEmailForUnexisting(Wallet);

        AccountInfo.getAccountInfo('not_exist@example.com', emitter).then(function () {
            expect(emitSpy).to.have.been.calledWith('post:account_info', { info: 'User does not exist!'});
            expect(emitSpy).to.have.callCount(1);
            done();
        }).done(null, function (error) { done(error); });
    });

    it('should get account_info for admin email', function (done) {
        Wallet.findByEmail.restore();
        TestingUtils.buildFindByEmailForAdmin(Wallet);

        AccountInfo.getAccountInfo('admin@admin.com', emitter).then(function () {
            expect(emitSpy).to.have.callCount(1);
            expect(emitSpy).to.have.been.calledWith('post:account_info', { balance: 0});
            done();
        }).done(null, function (error) { done(error); });
    });

});
