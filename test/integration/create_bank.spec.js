'use strict';

var app = require('../../server/app');

var chai = require('chai');
var expect = chai.expect;

var TestingUtils = require('../utils/testing_utils');
var CreateBank = require('../../server/api/create_bank/create_bank.socket');
var CreateAdminUser = require('../../server/api/create_admin_user_for_bank/create_admin_user_for_bank.socket');
var ClientEventEmitter = require('../../server/utils/ClientEventEmitter/ClientEventEmitter.service');

describe('ITest Create Bank', function () {
	var socketSpy;
	var emitter;
	
	beforeEach(function () {
		socketSpy = TestingUtils.buildSocketSpy();
		emitter = new ClientEventEmitter(socketSpy);
		
		CreateAdminUser.register(socketSpy, emitter);
	});

	afterEach(function (done) {
		TestingUtils.restoreAll();
		TestingUtils.dropMongodbDatabase().then(function () {
			done();
		});
	});

	it('should create a bank and an admin user for it', function (done) {
		var bankInfo = {
			name: 'brd',
			info: 'BRD Societe Generale',
			email: 'admin@brd.com',
			password: '1234',
		};

		emitter.on('post:create_admin_user_for_bank', function (result) {
 			expect(result.status).to.eql('success');
			expect(result.user.email).to.eql(bankInfo.email);
			expect(result.user.name).to.eql(bankInfo.info);
			done();
		});
		
		CreateBank.createBank(emitter, bankInfo).then(function(data) {
			CreateBank.createBankAndUser(emitter, data);
		}).fail(function(err) {
			done(err);
		});
		// function (bank) {
		// 	expect(bank.email).to.eql(bankInfo.email);
		// 	expect(bank.info).to.eql(bankInfo.info);
		// 	expect(bank.name).to.eql(bankInfo.name);
		// 	done();
		// },
		// 	function (error) {
		// 		done(error);
		// });
	});
});
