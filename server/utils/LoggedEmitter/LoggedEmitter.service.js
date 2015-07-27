var Q = require('q');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var debug = require('debug')('EventEmitter');

var loggedEmitter = {
//    emit: eventEmitter.emit,
    on: eventEmitter.on,
    emit: loggedEmit,
//    on: loggedOn,
    eventEmitter: eventEmitter,
    debug: debug
};

function loggedOn(eventName, listenerFunction) {
    return eventEmitter.on(eventName, loggedListenerFunction);

    function loggedListenerFunction(args) {
        loggedEmitter.debug(' <=== on(', eventName, args, ')');
        listenerFunction.apply(eventEmitter, args);
    }
}

function loggedEmit(eventName, eventObject) {
    console.log('loggedEmit', eventName, eventObject);
    loggedEmitter.debug(' ===> emit(', eventName, eventObject, ')');
    return eventEmitter.emit(eventName, eventObject);
}

module.exports = loggedEmitter;