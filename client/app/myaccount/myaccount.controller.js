'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet, RIPPLE_ROOT_ACCOUNT, TrustLineService, RippleRemoteService) {

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.amountToTransfer = 100;

        $scope.getAmountDisplayText = function (amount) {
            var number = Number(amount);
            if (amount === undefined) {
                return '';
            }
            if (!isNaN(number)) {
                return (number / 100000) + ',' + (number % 100000);
            }

            return String(amount.value).replace(/"/g, '') + ' ' + amount.currency;
        };


        var loadBalance = function (walletPublicKey) {
            RippleRemoteService.onRemotePresent(function (remote) {

                var rootAddress = RIPPLE_ROOT_ACCOUNT.address;
                if (walletPublicKey !== rootAddress) {
                    remote.requestRippleBalance(walletPublicKey, rootAddress, 'EUR', null, function (err, info) {
                        /*jshint camelcase: false */
                        $scope.ballance = String(info.account_balance._value).replace(/"/g, '');
                        $scope.account = walletPublicKey; //info.account_data.Account;
                        _.defer(function () {
                            $scope.$apply();
                        });
                    });
                } else {
                    $scope.ballance = 0;
                    $scope.account = walletPublicKey; //info.account_data.Account;
                    _.defer(function () {
                        $scope.$apply();
                    });
                }

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
        };

        var loadCurrentUserBalance = function (callback) {
            if ($scope.getMyAccountUser().email) {
                Wallet.getByOwnerEmail({ownerEmail: $scope.getMyAccountUser().email}).$promise.then(function (data) {
                    if (data.length >= 1) {
                        $scope.wallet = data[0];
                        loadBalance($scope.wallet.publicKey);
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

                                            remote.requestAccountInfo(reqOptions, function (err, info) {
                                                if (err) {
                                                    swal('Error', 'There was an error communicating with the server: ' + err.message, 'error');
                                                }
                                                else {
                                                    var crtFlags = info.account_data.Flags;
                                                    if (crtFlags & 0x00800000 == 0) {
                                                        // CS Need to set flags
                                                    } else {
                                                        swal('Info', 'The admin account wallet has the DefaultRipple flag active, flags are: ' + crtFlags, 'info');
                                                    }
                                                }
                                            });
                                        })
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

        var refreshPeers = function () {
            RippleRemoteService.onRemotePresent(function (remote){
                remote.requestPeers(function (error, info) {
                    $scope.peers = info.peers;
                    _.defer(function () {
                        $scope.$apply();
                    });
                });
            });
        };

        RippleRemoteService.onRemotePresent(function (remote) {
            var streams = [
                'ledger',
                'transactions',
                'random'
            ];

            var request = remote.requestSubscribe(streams);

            request.on('error', function (error) {
                console.log('request error: ', error);
            });


            // the `ledger_closed` and `transaction` will come in on the remote
            // since the request for subscribe is finalized after the success return
            // the streaming events will still come in, but not on the initial request
            remote.on('ledger_closed', function (ledger) {
                /*jshint camelcase: false */
                $scope.ledgerClosed = ledger.ledger_hash;
                _.defer(function () {
                    $scope.$apply();
                });
                refreshPeers();
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

            // fire the request
            request.request();

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
            refreshPeers();
        });
    });
