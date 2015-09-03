'use strict';

angular.module('riwebApp')
    .service('RippleTransactionService', function ($location, $window, RippleWalletService, Wallet, Auth, RiwebSocketService, usSpinnerService) {
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

        function transferMoneyFromCurrentAccount(amountToTransfer, destinationEmailAddress, currentUser, orderRequestId, returnUrl, cancelUrl) {
            if (!currentUser) {
                currentUser = Auth.getCurrentUser();
            }

            if(currentUser.role === 'merchant'){
              swal({  title: 'Error',
                  text: 'Sorry cannot purchase with a merchant user! ',
                  type: 'error'
                });
            } else {
              usSpinnerService.spin('purchase-spinner');
              RiwebSocketService.on('post:make_transfer', function (result) {
                usSpinnerService.stop('purchase-spinner');
                if (result.status === 'success') {
                  swal({  title: 'Transfer success!',
                      text: 'Congratulations ' + currentUser.name + '! You transfered ' + amountToTransfer + ' to ' + destinationEmailAddress,
                      type: 'success'
                    },
                    function () {
                      setTimeout(function() {
                        if (returnUrl) {
                          $window.location.href = returnUrl;
                        } else {
                          $location.path('/myaccount');
                        }
                      }, 500);
                    });
                } else {
                  swal({  title: 'Error',
                      text: 'Sorry there was a problem processing your request! ' + result.message,
                      type: 'error'
                    },
                    function() {
                      setTimeout(function() {
                        if (cancelUrl) {
                          $location(cancelUrl);
                        }
                      }, 500);
                    }
                  );
                }
              });

              RiwebSocketService.emit('make_transfer', { fromEmail: currentUser.email, toEmail: destinationEmailAddress, amount: amountToTransfer, orderRequestId: orderRequestId });

            }
        }

        return {
            transferMoney: transferMoney,
            transferMoneyFromCurrentAccount: transferMoneyFromCurrentAccount
        };

    });
