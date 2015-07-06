'use strict';

angular.module('riwebApp')
  .service('RippleWalletService', function (Wallet, RippleRemoteService, RippleAccountService, TrustLineService,
                                            Auth, RIPPLE_ROOT_ACCOUNT) {

        function loadCurrentUserBalance($scope, callback) {
            if (Auth.getCurrentUser().email) {
                Wallet.getByOwnerEmail({ownerEmail: Auth.getCurrentUser().email}).$promise.then(function (data) {
                    if (data.length >= 1) {
                        $scope.wallet = data[0];
                        RippleAccountService.loadBalance($scope, $scope.wallet.publicKey);
                        if (callback) {
                            callback($scope.wallet.publicKey);
                        }
                    } else {
                        createWallet($scope);
                    }
                });
            }
        }

        function saveWallet($scope, newWallet) {
            Wallet.save(newWallet,
                function () {
                    makeInitialXRPTransfer($scope, newWallet.publicKey);
                },
                function () {
                    swal('Error', 'Sorry there was a problem processing your request!', 'error');
                });
        }

        function makeInitialXRPTransfer($scope, destinationAddress) {
            //do not send money to self
            if (destinationAddress !== RIPPLE_ROOT_ACCOUNT.address) {
                RippleRemoteService.onRemotePresent(function (remote){
                    remote.setSecret(RIPPLE_ROOT_ACCOUNT.address, RIPPLE_ROOT_ACCOUNT.secret);

                    var transaction = remote.createTransaction('Payment', {
                        account: RIPPLE_ROOT_ACCOUNT.address,
                        destination: destinationAddress,
                        amount: 300000000
                    });

                    transaction.on('resubmitted', function () {
                        console.log('resubmitted');
                    });

                    transaction.submit(function (err) {
                        if (err) {
                            swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                        }
                        loadCurrentUserBalance($scope, TrustLineService.buildMakeInitialTrustLines($scope, remote));
                        // submission has finalized with either an error or success.
                        // the transaction will not be retried after this point
                    });
                });
            } else {
                loadCurrentUserBalance($scope);
            }
        }

        function createWallet($scope) {
            console.log('Creating wallet');
            var currentUser = Auth.getCurrentUser();
            if (currentUser) {
                if (currentUser.email !== $scope.makingWalletForEmail) {
                    $scope.makingWalletForEmail = currentUser.email;
                    Wallet.getByOwnerEmail({ownerEmail: currentUser.email}).$promise
                        .then(function (data) {
                            if (data.length < 1) {
                                var newWallet = {};
                                newWallet.ownerEmail = currentUser.email;
                                if (currentUser.email === 'admin@admin.com') {
                                    var checkColdWalletFlags = function () {
                                        RippleRemoteService.onRemotePresent(function (remote) {

                                            var reqOptions = {
                                                account: RIPPLE_ROOT_ACCOUNT.address,
                                                ledger: 'validated'
                                            };

                                            remote.requestAccountFlags(reqOptions, function (err, flags) {
                                                if (err) {
                                                    swal('Error', 'There was an error communicating with the server: ' + err.message, 'error');
                                                }
                                                else {
                                                    /*jshint bitwise: false*/
                                                    if (!(flags & 0x00800000)) {
                                                        // OK, let's set the DefaultRipple flag if it's not there
                                                        remote.setSecret(RIPPLE_ROOT_ACCOUNT.address, RIPPLE_ROOT_ACCOUNT.secret);

                                                        var transaction = remote.createTransaction('AccountSet', {
                                                            account: RIPPLE_ROOT_ACCOUNT.address,
                                                            set: 'DefaultRipple'
                                                        });

                                                        transaction.on('resubmitted', function() {
                                                            console.log('resubmitted');
                                                        });

                                                        transaction.submit(function(err) {
                                                            if (err) {
                                                                swal('Error', 'Failed to set the DefaultRipple flag on the cold wallet account: ' + err.message, 'error');
                                                            }
                                                            else {
                                                                swal('Info', 'Set the DefaultRipple flag on the cold wallet account', 'info');
                                                            }
                                                        });

                                                    } else {
                                                        swal('Info', 'The admin account wallet has the DefaultRipple flag active, flags are: ' + flags, 'info');
                                                    }
                                                }
                                            });
                                        });
                                    };

                                    //reuse existing known wallet
                                    newWallet.publicKey = RIPPLE_ROOT_ACCOUNT.address;
                                    newWallet.passphrase = RIPPLE_ROOT_ACCOUNT.secret;
                                    saveWallet($scope, newWallet);
                                    checkColdWalletFlags();
                                } else {
                                    // generate new wallet
                                    var wallet = ripple.Wallet.generate();
                                    newWallet.publicKey = wallet.address;
                                    newWallet.passphrase = wallet.secret;
                                    saveWallet($scope, newWallet);
                                }
                            }
                        });
                }
            }
        }

        return {
            createWallet: createWallet,
            loadCurrentUserBalance: loadCurrentUserBalance
        };
  });
