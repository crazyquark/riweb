'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, $rootScope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT,
        RippleRemoteService, FormattingService, RipplePeersService,
        RippleAccountService, RippleWalletService, RippleTransactionService) {
        
        if ($rootScope.message) {

            delete $rootScope.message
        }
        $scope.amountToTransfer = 100;

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;

        $scope.transferMoney = function () {
            RippleTransactionService.transferMoney($scope.amountToTransfer);
        };

        $scope.serverInfo = RippleRemoteService.serverInfo;
        $scope.peersInfo = RipplePeersService.peersInfo;
        $scope.accountInfo = RippleAccountService.accountInfo;
        $scope.walletInfo = RippleWalletService.walletInfo;

        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;
        var refreshPeers = RipplePeersService.refreshPeers;

        function refreshAngular() {
            _.defer(function () {
                $scope.$apply();
            });
        }

        function refreshCurrentUserWallet() {
            RippleWalletService.getCurrentUserWallet(function () {
                loadCurrentUserBalance(refreshAngular);
            });
        }

        $scope.$on('currentUser', function () {
            refreshCurrentUserWallet();
        });

        refreshCurrentUserWallet();
        RippleRemoteService.onRemotePresent(function (remote) {

            remote.on('ledger_closed', function () {
                refreshPeers(refreshAngular);
                loadCurrentUserBalance(refreshAngular);
            });

            remote.on('transactions', function () {
                loadCurrentUserBalance(refreshAngular);
            });
        });
    });
