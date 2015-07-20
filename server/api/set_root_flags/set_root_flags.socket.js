/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Q = require('q');
var Utils = require('./../../utils/utils');

function setRootFlags() {
	
}

exports.register = function() {
	Utils.getEventEmitter().on('set_root_flags', function() {
		setRootFlags();
	})  
}

