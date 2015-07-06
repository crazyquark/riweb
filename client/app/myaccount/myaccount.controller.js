'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService,
                                           RippleAccountService, RippleWalletService, RippleTransactionService) {

        $scope.amountToTransfer = 100;

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;

        $scope.transferMoney = function(){
            RippleTransactionService.transferMoney($scope);
        };

        $scope.serverInfo = RippleRemoteService.serverInfo;
        $scope.peersInfo = RipplePeersService.peersInfo;

        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;
        var refreshPeers = RipplePeersService.refreshPeers;

        RippleRemoteService.onRemotePresent(function (remote) {

            remote.on('ledger_closed', function () {
                refreshPeers();
                loadCurrentUserBalance($scope);
            });

            remote.on('transactions', function () {
                loadCurrentUserBalance($scope);
            });

            Auth.isLoggedInAsync(function(){
                loadCurrentUserBalance($scope);
            });
            refreshPeers($scope);
        });
    });
