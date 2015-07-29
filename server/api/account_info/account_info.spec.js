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

describe('Test account_info', function () {
    var socket;
    beforeEach(function () {
        socket = TestingUtils.buildSocketSpy();

        TestingUtils.buildRippleWalletGenerateForNonAdmin();

        AccountInfo.register(socket);

        TestingUtils.buildNewConnectedRemoteStub();
    });

    beforeEach(function () {
        TestingUtils.buildWalletSpy();
    });
    afterEach(function () {
        TestingUtils.restoreWalletSpy();
    });
    afterEach(function (done) {
        TestingUtils.dropMongodbDatabase().then(function(){done();});
        TestingUtils.restoreRippleWalletGenerate();
    });

    it('should get account_info for unexisting email', function (done) {
        TestingUtils.buildFindByOwnerEmailForUnexisting(Wallet);

        AccountInfo.getAccountInfo('not_exist@example.com', socket).then(function () {
            expect(socket.emit).to.have.been.calledWith('post:account_info', {info: 'User does not exist!'});
            expect(socket.emit).to.have.callCount(1);
            done();
        }).done(null, function(error){done(error);});
    });

    it('should get account_info for admin email', function (done) {
        TestingUtils.buildFindByOwnerEmailForAdmin(Wallet);

        AccountInfo.getAccountInfo('admin@admin.com', socket).then(function () {
            expect(socket.emit).to.have.callCount(1);
            expect(socket.emit).to.have.been.calledWith('post:account_info', {balance: 0});
            done();
        }).done(null, function(error){done(error);});
    });

});
