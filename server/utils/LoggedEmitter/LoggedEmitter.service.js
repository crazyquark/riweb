var Q = require('q');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var debug = require('debug')('EventEmitter');

var loggedEmitter = {
    emit: loggedEmit,
    on: loggedOn,
    once: loggedOnce,
    eventEmitter: eventEmitter,
    debug: debug
};

function loggedOn(eventName, listenerFunction) {
    loggedEmitter.debug(' ==== register on(', eventName, listenerFunction, ')');
    eventEmitter.on(eventName, loggedListenerFunction);

    function loggedListenerFunction() {
        var eventObject = arguments[0];
        loggedEmitter.debug(' <=== on(', eventName, eventObject, ')');
        listenerFunction.call(null, eventObject);
    }

    return loggedListenerFunction;
}

function loggedOnce(eventName, listenerFunction) {
    loggedEmitter.debug(' ==== register once(', eventName, listenerFunction, ')');
    eventEmitter.once(eventName, loggedListenerFunction);

    function loggedListenerFunction() {
        var eventObject = arguments[0];
        loggedEmitter.debug(' <=== on(', eventName, eventObject, ')');
        listenerFunction.call(null, eventObject);
    }

    return loggedListenerFunction;
}

function loggedEmit(eventName, eventObject) {
    loggedEmitter.debug(' ===> emit(', eventName, eventObject, ')');
    return eventEmitter.emit(eventName, eventObject);
}

module.exports = loggedEmitter;