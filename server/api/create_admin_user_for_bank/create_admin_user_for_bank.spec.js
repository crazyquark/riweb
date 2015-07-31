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

  it('should create an user when a create_admin_user_for_bank event is received', function (done) {
    var adminInfo = {
      bankId:  mongoose.Types.ObjectId('55bb258310e509b66b6a9c27'),
      email: 'admin@brd.com',
      password: 'secret',
    };
    
    CreateAdminUserForBank.createAdminUserForBank(adminInfo).then(function(user){
      done();
    });
  });
});