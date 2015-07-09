/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/create_wallets', require('./api/create_wallet'));
  app.use('/api/comments', require('./api/comment'));
  app.use('/api/walletservice', require('./api/ServerWalletService'));
  app.use('/api/bankaccounts', require('./api/bankaccount'));
  app.use('/api/wallets', require('./api/wallet'));
  app.use('/api/users', require('./api/user'));

  app.use('/auth', require('./auth'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
