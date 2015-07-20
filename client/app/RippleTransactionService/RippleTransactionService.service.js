'use strict';

angular.module('riwebApp')
  .service('RippleTransactionService', function (RIPPLE_ROOT_ACCOUNT, RippleRemoteService, RippleWalletService, Wallet, Auth, socket) {
        function transferMoney(amountToTransfer) {
            swal({
                    title: 'Transfer money!',
                    text: 'Transfer ' + amountToTransfer + ' to the following email address: ',
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
                    transferMoneyFromCurrentAccount(amountToTransfer, inputValue);
                });
        }

        function transferMoneyFromCurrentAccount(amountToTransfer, destinationEmailAddress) {
            
            socket.socket.on('post:make_transfer', function(result) {
               if (result.status === 'success') {
                    swal('Transfer success!', 'Congratulations ' + Auth.getCurrentUser().name + '! You transfered ' + amountToTransfer + ' to ' + destinationEmailAddress, 'success');
               } else {
                    swal('Error', 'Sorry there was a problem processing your request! ' + result.error, 'error');
               } 
            });
            socket.socket.emit('make_transfer', { fromEmail: Auth.getCurrentUser().email, toEmail: destinationEmailAddress, amount: amountToTransfer });
            
            // Wallet.getByOwnerEmail({ownerEmail: Auth.getCurrentUser().email}).$promise.then(function (currentAccountData) {
            //     var currentAccountWallet = currentAccountData[0];
            //     Wallet.getByOwnerEmail({ownerEmail: destinationEmailAddress}).$promise.then(function (destinationAccountData) {
            //         if (destinationAccountData.length >= 1) {
            //             var wallet = destinationAccountData[0];
            //             var destinationAddress = wallet.publicKey;

            //             RippleRemoteService.onRemotePresent(function (remote) {
            //                 remote.setSecret(currentAccountWallet.publicKey, currentAccountWallet.passphrase);

            //                 var transaction = remote.createTransaction('Payment', {
            //                     account: currentAccountWallet.publicKey,
            //                     destination: destinationAddress,
            //                     amount: amountToTransfer + '/EUR/' + RIPPLE_ROOT_ACCOUNT.address
            //                 });

            //                 transaction.submit(function (err, res) {
            //                     if (err) {
            //                         swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
            //                     }
            //                     if (res) {
            //                         swal('Transfer success!', 'Congratulations ' + Auth.getCurrentUser().name + '! You transfered ' + amountToTransfer + ' to ' + destinationEmailAddress, 'success');
            //                     }
            //                     RippleWalletService.loadCurrentUserBalance();
            //                     // submission has finalized with either an error or success.
            //                     // the transaction will not be retried after this point
            //                 });
            //             });
            //         } else {
            //             swal('Error', 'Sorry no address found!', 'error');
            //         }
            //     });
            // });
        }

        return {
            transferMoney: transferMoney,
            transferMoneyFromCurrentAccount: transferMoneyFromCurrentAccount
        };

    });
