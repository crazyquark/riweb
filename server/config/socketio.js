/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var debug = require('debug')('ConfigSocketio');

var Utils = require('../utils/utils');

var ClientEventEmitter = require('../utils/ClientEventEmitter/ClientEventEmitter.service');

// When the user disconnects.. perform this
function onDisconnect(socket) {
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  var clientEventEmitter = new ClientEventEmitter(socket);

  // Insert sockets below
  require('../api/Order/Order.socket').register(clientEventEmitter);
  require('../api/order_request/order_request.socket').register(clientEventEmitter);
  require('../api/RealBankAccount/RealBankAccount.socket').register(clientEventEmitter);
  require('../api/create_admin_user_for_bank/create_admin_user_for_bank.socket').register(clientEventEmitter);
  require('../api/create_bank/create_bank.socket').register(clientEventEmitter);
  require('../api/list_transactions/list_transactions.socket').register(clientEventEmitter);
  require('../api/set_root_flags/set_root_flags.socket').register(clientEventEmitter);
  require('../api/make_transfer/make_transfer.socket').register(clientEventEmitter);
  require('../api/set_trust/set_trust.socket').register(clientEventEmitter);
  require('../api/account_info/account_info.socket').register(clientEventEmitter);
  require('../api/create_wallet/create_wallet.socket').register(clientEventEmitter);
  require('../api/bankaccount/bankaccount.socket').register(clientEventEmitter);
  require('../api/wallet/wallet.socket').register(clientEventEmitter);
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
