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
var SetTrust = require('./set_trust.socket');

var TestingUtils = require('./../../../test/utils/testing_utils');

describe('Test set_trust', function () {

    var remote;
    beforeEach(function (done) {
        remote = TestingUtils.buildRemoteStub();
        sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remote));
        TestingUtils.dropMongodbDatabase().then(function(){done();});
    });

    afterEach(function () {
      TestingUtils.restoreAll();
    });

    it('should respond with success on proper trust set', function (done) {
        var adminWallet = TestingUtils.getAdminMongooseWallet();
        var nonAdminWallet = TestingUtils.getNonAdminMongooseWallet();
        var data = {
            rippleDestinationAddr: adminWallet.address,
            rippleSourceAddr: nonAdminWallet.address,
            rippleSourceSecret: nonAdminWallet.secret
        };
        sinon.mock(remote, 'createTransaction');

        SetTrust.setTrust(data.rippleDestinationAddr, data.rippleSourceAddr, data.rippleSourceSecret).then(function (result) {
            expect(result.status).to.eql('success');
            expect(remote.createTransaction).to.have.been.calledWith(
                'TrustSet', {
                    account: nonAdminWallet.address,
                    limit: '1000/EUR/' + adminWallet.address
                });
            done();
        }).done(null, function (error) {
            done(error);
        });
    });
});
