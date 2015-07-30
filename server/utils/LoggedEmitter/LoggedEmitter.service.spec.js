'use strict';


var sinon = require('sinon');
var app = require('../../app');
var chai = require('chai');
var io = require('socket.io');
var Q = require('q');
var expect = chai.expect;
var ripple = require('ripple-lib');
var sinonChai = require("sinon-chai");
chai.use(sinonChai);

var TestingUtils = require('./../../../test/utils/testing_utils');

var LoggedEmitter = require('../LoggedEmitter/LoggedEmitter.service');

describe('Testing LoggedEmitter', function () {

    var emitSpy, debugSpy, onSpy;
    beforeEach(function () {
        emitSpy = sinon.spy(LoggedEmitter.eventEmitter, 'emit');
        onSpy = sinon.spy(LoggedEmitter.eventEmitter, 'on');
        debugSpy = sinon.spy(LoggedEmitter, 'debug');
    });
    afterEach(function () {
        TestingUtils.restoreAll();
        emitSpy.restore();
        onSpy.restore();
        debugSpy.restore();
    });

    it('should log to debug when emitting', function () {
        LoggedEmitter.emit('foo', {foo: 'bar'});

        expect(emitSpy).to.have.been.calledWith('foo', {foo: 'bar'});
        expect(emitSpy).to.have.callCount(1);
    });

    it('should emit when emitting with LoggedEmitter', function () {
        LoggedEmitter.emit('foo', {foo: 'bar'});

        expect(debugSpy).to.have.been.calledWith(' ===> emit(', 'foo', {foo: 'bar'}, ')');
        expect(debugSpy).to.have.callCount(1);
    });

    it('should call EventEmitter.on when an event has been emitted', function () {
        var myOnSpy = sinon.spy();
        var wrappedListenerFunction = LoggedEmitter.on('foo', myOnSpy);

        wrappedListenerFunction({foo: 'bar'});

        expect(myOnSpy).to.have.been.calledWith({foo: 'bar'});
        expect(myOnSpy).to.have.callCount(1);
    });

});
