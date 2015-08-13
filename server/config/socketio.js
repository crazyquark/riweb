/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var debug = require('debug')('ConfigSocketio');

// When the user disconnects.. perform this
function onDisconnect(socket) {
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  // Insert sockets below
  require('../api/RealBankAccount/RealBankAccount.socket').register(socket);
  require('../api/create_admin_user_for_bank/create_admin_user_for_bank.socket').register(socket);
  require('../api/create_bank/create_bank.socket').register(socket);
  debug('------Registering all the things');
  require('../api/list_transactions/list_transactions.socket').register(socket);
  require('../api/set_root_flags/set_root_flags.socket').register(socket);
  require('../api/make_transfer/make_transfer.socket').register(socket);
  require('../api/set_trust/set_trust.socket').register(socket);
  require('../api/account_info/account_info.socket').register(socket);
  require('../api/create_wallet/create_wallet.socket').register(socket);
  require('../api/bankaccount/bankaccount.socket').register(socket);
  require('../api/wallet/wallet.socket').register(socket);
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket);
  });
};
