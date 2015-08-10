'use strict';

var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var expect = chai.expect;
var Q = require('q');
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var Utils = require('./../../utils/utils');
var SetRootFlags = require('./set_root_flags.socket');

var TestingUtils = require('./../../../test/utils/testing_utils');

describe('Test set_root_flags', function () {

    var remote;
    beforeEach(function (done) {
        remote = TestingUtils.buildRemoteStub();
        sinon.stub(Utils, 'getNewConnectedAdminRemote').returns(Q(remote));
        sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remote));
        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
      TestingUtils.restoreAll();
    });

    it('should respond with success on proper trust set', function (done) {
        sinon.mock(remote, 'createTransaction');

        var account = {address: 'foo', secret: 'bar'};
        SetRootFlags.setRootFlags(account).then(function (result) {
            expect(result.status).to.eql('success');
            expect(remote.createTransaction).to.have.been.calledWith(
                'AccountSet', {
                    account: account.address,
                    set: 'DefaultRipple'
                });
            done();
        }).done(null, function (error) {
            done(error);
        });
    });
});
