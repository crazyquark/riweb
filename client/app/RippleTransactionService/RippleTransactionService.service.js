'use strict';

angular.module('riwebApp')
  .service('RippleTransactionService', function (RIPPLE_ROOT_ACCOUNT, RippleRemoteService, RippleWalletService, Wallet, Auth) {
        function transferMoney($scope) {
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
                    transferMoneyFromCurrentAccount($scope, inputValue);
                });
        }

        function transferMoneyFromCurrentAccount($scope, destinationEmailAddress) {

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
                            RippleWalletService.loadCurrentUserBalance($scope);
                            // submission has finalized with either an error or success.
                            // the transaction will not be retried after this point
                        });
                    });
                } else {
                    swal('Error', 'Sorry no address found!', 'error');
                }
            });
        }

        return {
            transferMoney: transferMoney,
            transferMoneyFromCurrentAccount: transferMoneyFromCurrentAccount
        };

    });
