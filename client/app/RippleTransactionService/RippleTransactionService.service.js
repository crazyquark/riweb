'use strict';

angular.module('riwebApp')
    .service('RippleTransactionService', function ($location, RippleWalletService, Wallet, Auth, RiwebSocketService) {
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

        function transferMoneyFromCurrentAccount(amountToTransfer, destinationEmailAddress, currentUser) {
          if(!currentUser){
            currentUser = Auth.getCurrentUser();
          }
          RiwebSocketService.on('post:make_transfer', function (result) {
              if (result.status === 'success') {
                $location.path(result.successUrl);
                swal('Transfer success!', 'Congratulations ' + currentUser.name + '! You transfered ' + amountToTransfer + ' to ' + destinationEmailAddress, 'success');
              } else {
                swal('Error', 'Sorry there was a problem processing your request! ' + result.message, 'error');
              }
          });
          RiwebSocketService.emit('make_transfer', { fromEmail: currentUser.email, toEmail: destinationEmailAddress, amount: amountToTransfer });
        }

        return {
            transferMoney: transferMoney,
            transferMoneyFromCurrentAccount: transferMoneyFromCurrentAccount
        };

    });
