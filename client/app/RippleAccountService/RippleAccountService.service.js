'use strict';

angular.module('riwebApp')
    .service('RippleAccountService', function (RippleRemoteService, RIPPLE_ROOT_ACCOUNT) {
        return {
            loadBalance: function ($scope, walletPublicKey) {
                RippleRemoteService.onRemotePresent(function (remote) {
                    var rootAddress = RIPPLE_ROOT_ACCOUNT.address;
                    if (walletPublicKey !== rootAddress) {
                        remote.requestRippleBalance(walletPublicKey, rootAddress, 'EUR', null, function (err, info) {
                            if(!err){
                                /*jshint camelcase: false */
                                $scope.ballance = String(info.account_balance._value).replace(/"/g, '');
                                $scope.account = walletPublicKey; //info.account_data.Account;
                                _.defer(function () {
                                    $scope.$apply();
                                });
                            } else {
                                console.error(err);
                            }
                        });
                    } else {
                        $scope.ballance = 0;
                        $scope.account = walletPublicKey; //info.account_data.Account;
                        _.defer(function () {
                            $scope.$apply();
                        });
                    }

                    /*jshint camelcase: false */
                    remote.requestAccountTransactions({account: $scope.wallet.publicKey, ledger_index_min: -1}, function (err, info) {
                        //delete old transactions first if they exist
                        if ($scope.transactions) {
                            delete $scope.transactions;
                        }
                        info.transactions.forEach(function (item) {

                            if (item.tx.Destination && item.tx.Amount.currency && item.meta.TransactionResult === 'tesSUCCESS') {
                                if (!$scope.transactions) {
                                    //make transactions lazy so we can have a relevant message
                                    $scope.transactions = [];
                                }
                                $scope.transactions.push(item);
                            }
                        });
                        _.defer(function () {
                            $scope.$apply();
                        });
                    });
                });
            }
    };
});