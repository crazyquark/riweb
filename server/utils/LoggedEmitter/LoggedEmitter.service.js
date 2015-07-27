var Q = require('q');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var debug = require('debug')('EventEmitter');

var loggedEmitter = {
    emit: loggedEmit,
    on: loggedOn,
    eventEmitter: eventEmitter,
    debug: debug
};

function loggedOn(eventName, listenerFunction) {
    eventEmitter.on(eventName, loggedListenerFunction);

    function loggedListenerFunction() {
        var eventObject = arguments[1];
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