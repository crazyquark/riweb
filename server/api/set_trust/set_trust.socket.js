/**
 * Service to create trust lines on Ripple
 */

'use strict';

var Utils = require('./../../utils/utils');

/**
* Creates a trst line between 2 ripple accounts
* @param rippleDestination target trustline endpoint
* @param rippleSource source trustline endpoint
* @param rippleSourceSecret source address secret (used to create the trustline)
*/
function set_trust(rippleDestination, rippleSource, rippleSourceSecret) {
  var remote = Utils.getNewConnectedRemote(rippleSource, );


}

exports.set_trust = set_trust;

exports.register = function(socket) {

}
