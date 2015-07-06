'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService,
                                           RippleRemoteService, FormattingService, RipplePeersService, RippleAccountService) {

        $scope.amountToTransfer = 100;

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.getAmountDisplayText = FormattingService.getAmountDisplayText;

        var loadCurrentUserBalance = function (callback) {
            if ($scope.getMyAccountUser().email) {
                Wallet.getByOwnerEmail({ownerEmail: $scope.getMyAccountUser().email}).$promise.then(function (data) {
                    if (data.length >= 1) {
                        $scope.wallet = data[0];
                        RippleAccountService.loadBalance($scope, $scope.wallet.publicKey);
                        if (callback) {
                            callback($scope.wallet.publicKey);
                        }
                    } else {
                        $scope.createWallet();
                    }
                });
            }
        };

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
                            loadCurrentUserBalance();
                            // submission has finalized with either an error or success.
                            // the transaction will not be retried after this point
                        });
                    });
                } else {
                    swal('Error', 'Sorry no address found!', 'error');
                }
            });
        };

        var makeInitialXRPTransfer = function (destinationAddress) {
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

                    transaction.submit(function (err, res) {
                        if (err) {
                            swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                        }
                        loadCurrentUserBalance(TrustLineService.buildMakeInitialTrustLines(remote, $scope));
                        // submission has finalized with either an error or success.
                        // the transaction will not be retried after this point
                    });
                });
            } else {
                loadCurrentUserBalance();
            }
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

        $scope.createWallet = function () {
            var currentUser = $scope.getMyAccountUser();
            if (currentUser) {
                if (currentUser.email !== $scope.makingWalletForEmail) {
                    $scope.makingWalletForEmail = currentUser.email;
                    Wallet.getByOwnerEmail({ownerEmail: currentUser.email}).$promise
                        .then(function (data) {
                            if (data.length < 1) {
                                var saveWallet = function (newWallet) {
                                    Wallet.save(newWallet,
                                        function (data) {
                                            makeInitialXRPTransfer(newWallet.publicKey);
                                        },
                                        function () {
                                            swal('Error', 'Sorry there was a problem processing your request!', 'error');
                                        }.bind(this));
                                };
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

                                                        transaction.submit(function(err, res) {
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
                                    saveWallet(newWallet);
                                    checkColdWalletFlags();
                                } else {
                                    // generate new wallet
                                    var wallet = ripple.Wallet.generate();
                                    newWallet.publicKey = wallet.address;
                                    newWallet.passphrase = wallet.secret;
                                    saveWallet(newWallet);
                                }
                            }
                        });
                }
            }
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
                loadCurrentUserBalance();
            });

            remote.on('transactions', function (foobar) {
                loadCurrentUserBalance();
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

            loadCurrentUserBalance();
            Auth.isLoggedInAsync(function(){
                loadCurrentUserBalance();
            });
            RipplePeersService.refreshPeers($scope);
        });
    });
