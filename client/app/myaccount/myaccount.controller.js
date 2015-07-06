'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService,
                                           RippleAccountService, RippleWalletService, RippleTransactionService) {

        $scope.amountToTransfer = 100;
        $scope.message = 'Not connected to any server';
        $scope.ledgerClosed = '';

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;
        $scope.transferMoney = function(){
            RippleTransactionService.transferMoney($scope);
        };
        $scope.serverInfo = RippleRemoteService.serverInfo;

        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;

        RippleRemoteService.onRemotePresent(function (remote) {

            remote.on('ledger_closed', function () {
                RipplePeersService.refreshPeers($scope);
                loadCurrentUserBalance($scope);
            });

            remote.on('transactions', function () {
                loadCurrentUserBalance($scope);
            });

            Auth.isLoggedInAsync(function(){
                loadCurrentUserBalance($scope);
            });
            RipplePeersService.refreshPeers($scope);
        });
    });
