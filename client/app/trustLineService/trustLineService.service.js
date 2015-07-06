'use strict';

angular.module('riwebApp')
  .service('TrustLineService', function (Auth, RIPPLE_ROOT_ACCOUNT) {

        function makeInitialTrustLines($scope, remote, rippleAddress) {
            remote.setSecret($scope.wallet.publicKey, $scope.wallet.passphrase);

            /*jshint camelcase: false */
            var transaction = remote.createTransaction('TrustSet', {
                account: rippleAddress,
                limit: '10000/EUR/' + RIPPLE_ROOT_ACCOUNT.address,
                set_flag: 'NoRipple'
            });

            transaction.submit(function (err, res) {
                if (err) {
                    swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                }
                if (res) {
                    swal('Congratulations, ' + Auth.getCurrentUser().name + '!', 'You just got a new wallet! ' + rippleAddress, 'success');
                }
            });
        }

        function buildMakeInitialTrustLines($scope, remote){
            return function(rippleAddress){
                makeInitialTrustLines($scope, remote, rippleAddress);
            };
        }

        return {
            buildMakeInitialTrustLines: buildMakeInitialTrustLines
        };
  });
