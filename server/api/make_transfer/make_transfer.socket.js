/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Q = require('q');

var Utils = require('./../../utils/utils');

function makeTransfer(fromEmail, toEmail, amout){
  var deferred = Q.defer();
  deferred.resolve("foobar");
  return deferred.promise;
}

exports.makeTransfer = makeTransfer;
exports.register = function() {
    Utils.getEventEmitter().on('make_transfer', function(data) {
        makeTransfer(data.fromEmail, data.toEmail, data.amout);
    });
};