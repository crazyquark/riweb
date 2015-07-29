/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/create_banks', require('./api/create_bank'));
  app.use('/api/list_transactions', require('./api/list_transactions'));
  app.use('/api/set_root_flags', require('./api/set_root_flags'));
  app.use('/api/make_transfers', require('./api/make_transfer'));
  app.use('/api/set_trust', require('./api/set_trust'));
  app.use('/api/account_info', require('./api/account_info'));
  app.use('/api/create_wallets', require('./api/create_wallet'));
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
