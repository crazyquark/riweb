'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService,
                                           RippleAccountService, RippleWalletService, RippleTransactionService) {

        $scope.amountToTransfer = 100;

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;

        $scope.transferMoney = function(){
            RippleTransactionService.transferMoney($scope.amountToTransfer);
        };

        $scope.serverInfo = RippleRemoteService.serverInfo;
        $scope.peersInfo = RipplePeersService.peersInfo;
        $scope.accountInfo = RippleAccountService.accountInfo;

        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;
        var refreshPeers = RipplePeersService.refreshPeers;

        function refreshAngular(){
            _.defer(function () {
                $scope.$apply();
            });
        }

        RippleRemoteService.onRemotePresent(function (remote) {

            remote.on('ledger_closed', function () {
                refreshPeers(refreshAngular);
                loadCurrentUserBalance(refreshAngular);
            });

            remote.on('transactions', function () {
                loadCurrentUserBalance(refreshAngular);
            });

            Auth.isLoggedInAsync(function(){
                loadCurrentUserBalance(refreshAngular);
            });
            refreshPeers(refreshAngular);
        });
    });
