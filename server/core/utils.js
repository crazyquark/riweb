
var ripple = require('ripple-lib');

var ROOT_RIPPLE_ACCOUNT = {
    address : 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    secret  : 'masterpassphrase'
};

var RIPPLED_WS_SERVER = 'ws://localhost:6006'

function getNewRemote(){
    return new ripple.Remote({
        servers: [ RIPPLED_WS_SERVER ]
    });
}

module.exports.getNewRemote = getNewRemote;
module.exports.ROOT_RIPPLE_ACCOUNT = ROOT_RIPPLE_ACCOUNT;