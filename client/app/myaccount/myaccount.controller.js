'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService,
                                           RippleAccountService, RippleWalletService) {

        $scope.amountToTransfer = 100;

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;
        var loadCurrentUserBalance = RippleWalletService.loadCurrentUserBalance;

        var transferMoneyFromCurrentAccount = function (destinationEmailAddress) {

            Wallet.getByOwnerEmail({ownerEmail: destinationEmailAddress}).$promise.then(function (data) {
                if (data.length >= 1) {
                    var wallet = data[0];
                    var destinationAddress = wallet.publicKey;

                    RippleRemoteService.onRemotePresent(function (remote){
                        remote.setSecret($scope.wallet.publicKey, $scope.wallet.passphrase);

                        var transaction = remote.createTransaction('Payment', {
                            account: $scope.wallet.publicKey,
                            destination: destinationAddress,
                            amount: $scope.amountToTransfer + '/EUR/' + RIPPLE_ROOT_ACCOUNT.address
                        });

                        transaction.on('resubmitted', function () {
                            console.log('resubmitted');
                        });

                        transaction.submit(function (err, res) {
                            if (err) {
                                swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                            }
                            if (res) {
                                swal('Transfer success!', 'Congratulations ' + Auth.getCurrentUser().name + '! You transfered ' + $scope.amountToTransfer + ' to ' + destinationEmailAddress, 'success');
                            }
                            loadCurrentUserBalance($scope);
                            // submission has finalized with either an error or success.
                            // the transaction will not be retried after this point
                        });
                    });
                } else {
                    swal('Error', 'Sorry no address found!', 'error');
                }
            });
        };

        $scope.transferMoney = function () {
            swal({
                    title: 'Transfer money!',
                    text: 'Transfer ' + $scope.amountToTransfer + ' to the following email address: ',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false,
                    inputPlaceholder: 'Write something'
                },
                function (inputValue) {
                    if (inputValue === false) {
                        return false;
                    }

                    if (inputValue === '') {
                        swal.showInputError('You need to write something!');
                        return false;
                    }
                    transferMoneyFromCurrentAccount(inputValue);
                });
        };

        $scope.message = 'Not connected to any server';
        $scope.ledgerClosed = '';
        $scope.error = '';

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
