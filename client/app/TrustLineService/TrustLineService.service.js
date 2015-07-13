'use strict';

angular.module('riwebApp')
  .service('TrustLineService', function (Auth, RIPPLE_ROOT_ACCOUNT) {

        function makeInitialTrustLines(walletInfo, remote, rippleAddress) {
            remote.setSecret(walletInfo.wallet.publicKey, walletInfo.wallet.passphrase);

            /*jshint camelcase: false */
            var transaction = remote.createTransaction('TrustSet', {
                account: rippleAddress,
                limit: '10000/EUR/' + RIPPLE_ROOT_ACCOUNT.address,
                set_flag: 'NoRipple'
            });

            transaction.submit(function (err) {
                if (err) {
                    swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                }
            });
        }

        function buildMakeInitialTrustLines(walletInfo, remote){
            return function(rippleAddress){
                makeInitialTrustLines(walletInfo, remote, rippleAddress);
            };
        }

        return {
            buildMakeInitialTrustLines: buildMakeInitialTrustLines
        };
  });
