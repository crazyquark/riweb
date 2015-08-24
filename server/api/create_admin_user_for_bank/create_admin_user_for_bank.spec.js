'use strict';

var sinon = require('sinon');
var app = require('../../app');
var Q = require('q');
var mongoose = require('mongoose');
var chai = require('chai');
var expect = chai.expect;
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var TestingUtils = require('../../../test/utils/testing_utils');
var Utils = require('../../utils/utils');

var CreateAdminUserForBank = require('./create_admin_user_for_bank.socket');

describe('Test create admin user for bank', function () {
  var emitSpy, socketSpy;

  var adminInfo = {
    bankId: mongoose.Types.ObjectId('55bb2947cdfccb2c13353502'),
    info: 'BRD',
    email: 'admin@brd.com',
    password: 'secret',
  };


  beforeEach(function (done) {
    emitSpy = sinon.spy(Utils, 'emitEvent');
    socketSpy = TestingUtils.buildSocketSpy();
    socketSpy.id = 'fooBarSocketId';
    CreateAdminUserForBank.register(socketSpy);
    Utils.setSocketId('fooBarSocketId');
    TestingUtils.dropMongodbDatabase().then(function () { done(); });
  });

  afterEach(function () {
    emitSpy.restore();
    TestingUtils.restoreAll();
    
    Utils.getEventEmitter().eventEmitter.removeAllListeners('post:create_admin_user_for_bank');
  })

  it('should create an admin user for the given bank ID', function (done) {
    Utils.onEvent('post:create_admin_user_for_bank', function (result) {
      expect(result.status).to.eql('success');
      if (result.status === 'success') {
        expect(result.user.email).to.eql(adminInfo.email);
        expect(result.user.name).to.eql(adminInfo.info);
      }
   });

    CreateAdminUserForBank.createAdminUserForBank(adminInfo).then(function (user) {
      expect(user.email).to.eql(adminInfo.email);
      expect(user.name).to.eql(adminInfo.info);
      expect(emitSpy).to.have.callCount(1);
      expect(emitSpy).to.have.been.calledWith('post:create_admin_user_for_bank', { 
        status: 'success',
        user: { email: user.email, name: user.name },
        socketId: 'fooBarSocketId' });
      done();
    }).fail(function (error) { done(error); });
  });
});
