'use strict';

var should = require('should');
var app = require('../../app');
var request = require('supertest');
var TestingUtils = require('./../../../test/utils/testing_utils');

describe('Test list_transactions', function() {
    afterEach(function () {
        TestingUtils.dropMongodbDatabase();
    });

});