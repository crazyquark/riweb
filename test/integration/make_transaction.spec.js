'use strict';

var app = require('../../server/app');
var config = require('../../server/config/environment');

var chai = require('chai');
var expect = chai.expect;

var TestingUtils = require('../utils/testing_utils');

describe('ITest transfers', function () {
	beforeEach(function (done) {
		TestingUtils.dropMongodbDatabase().then(function () {
			done();
		});
	});
	
	it('Transfer from admin to regular user', function(done) {
		done();
	});
});
