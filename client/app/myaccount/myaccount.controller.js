'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService,
                                           RippleAccountService, RippleWalletService, RippleTransactionService) {

        $scope.amountToTransfer = 100;
        $scope.message = 'Not connected to any server';
        $scope.ledgerClosed = '';
        $scope.error = '';

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;
        $scope.transferMoney = function(){
            RippleTransactionService.transferMoney($scope);
        };

        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;

        RippleRemoteService.onRemotePresent(function (remote) {

            // the `ledger_closed` and `transaction` will come in on the remote
            // since the request for subscribe is finalized after the success return
            // the streaming events will still come in, but not on the initial request
            remote.on('ledger_closed', function (ledger) {
                /*jshint camelcase: false */
                $scope.ledgerClosed = ledger.ledger_hash;
                _.defer(function () {
                    $scope.$apply();
                });
                RipplePeersService.refreshPeers($scope);
                loadCurrentUserBalance($scope);
            });

            remote.on('transactions', function (foobar) {
                loadCurrentUserBalance($scope);
                console.log('' + foobar);
            });

            remote.on('error', function (error) {
                $scope.error = error;
                _.defer(function () {
                    $scope.$apply();
                });
            });

            /* remote connected */
            remote.requestServerInfo(function (err, info) {
                /*jshint camelcase: false */
                var pubkeyNode = info.info.pubkey_node;
                if (pubkeyNode) {
                    $scope.message = 'Connected to server ' + pubkeyNode;
                    $scope.server_name = pubkeyNode;
                    $scope.server_error = '';
                } else {
                    $scope.server_name = '';
                    $scope.server_error = 'Error ' + err;
                }
                _.defer(function () {
                    $scope.$apply();
                });
            });

            loadCurrentUserBalance($scope);
            Auth.isLoggedInAsync(function(){
                loadCurrentUserBalance($scope);
            });
            RipplePeersService.refreshPeers($scope);
        });
    });
