'use strict';

angular.module('riwebApp')
    .controller('MyaccountCtrl', function ($scope, Auth, User, Wallet) {
        var Remote = ripple.Remote;
        var remote = new Remote({
            // see the API Reference for available options
            servers: [ 'ws://localhost:6006' ]
        });

        $scope.getMyAccountUser = Auth.getCurrentUser;
        $scope.amountToTransfer = 100;

        var loadBalance = function(remote, walletPublicKey){
            remote.requestAccountInfo({account: walletPublicKey}, function (err, info) {
                /*jshint camelcase: false */
                $scope.ballance = info.account_data.Balance;
                $scope.account = info.account_data.Account;
                $scope.$apply();
            });
            remote.requestAccountTransactions({account: $scope.account, ledger_index_min: -1}, function(err, info){
                $scope.transactions = info.transactions;
            });
        };

        var makeInitialTrustlines = function(destinationAddress){
            remote.setSecret($scope.account, $scope.wallet.passphrase);

            var transaction = remote.createTransaction('TrustSet', {
                account: destinationAddress,
                limit: '10000/EUR/rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
                set_flag: 'NoRipple'
            });

            transaction.on('resubmitted', function() {
                console.log('resubmitted');
            });

            transaction.submit(function(err, res) {
                console.log('submit' + res);
                console.error('err' + err);
                if(err){
                    swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                }
                if(res){
                    swal('Good job!', 'Congratulations ' + Auth.getCurrentUser().name + '! You created an new wallet! ' + destinationAddress, 'success');
                }
            });
        };

        var loadCurrentUserBalance = function(callback){
            Wallet.getByOwnerEmail({ownerEmail: $scope.getMyAccountUser().email}).$promise.then(function (data) {
                if (data.length === 1) {
                    $scope.wallet = data[0];
                    loadBalance(remote, $scope.wallet.publicKey);
                    if(callback){
                        callback($scope.wallet.publicKey);
                    }
                } else {
                    $scope.wallet = undefined;
                }
            });
        };

        var transferMoneyFromCurrentAccount = function(destinationEmailAddress){

            Wallet.getByOwnerEmail({ownerEmail: destinationEmailAddress}).$promise.then(function (data) {
                if (data.length === 1) {
                    var wallet = data[0];
                    var destinationAddress = wallet.publicKey;

                    remote.setSecret($scope.account, $scope.wallet.passphrase);

                    var transaction = remote.createTransaction('Payment', {
                        account: $scope.account,
                        destination: destinationAddress,
                        amount: $scope.amountToTransfer
                    });

                    transaction.on('resubmitted', function() {
                        console.log('resubmitted');
                    });

                    transaction.submit(function(err, res) {
                        console.log('submit' + res);
                        console.error('err' + err);
                        if(err){
                            swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                        }
                        if(res){
                            swal('Good job!', 'Congratulations ' + Auth.getCurrentUser().name + '! You transfered ' + $scope.amountToTransfer + ' to ' + destinationEmailAddress, 'success');
                        }
                        loadCurrentUserBalance();
                        // submission has finalized with either an error or success.
                        // the transaction will not be retried after this point
                    });

                } else {
                    swal('Error', 'Sorry no address found!', 'error');
                }
            });
        };

        var makeInitialXRPTransfer = function(destinationAddress){
            //do not send money to self
            if(destinationAddress!=='rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'){
                remote.setSecret('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', 'masterpassphrase');

                var transaction = remote.createTransaction('Payment', {
                    account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
                    destination: destinationAddress,
                    amount: 3000000000
                });

                transaction.on('resubmitted', function() {
                    console.log('resubmitted');
                });

                transaction.submit(function(err, res) {
                    console.log('submit' + res);
                    console.error('err' + err);
                    if(err){
                        swal('Error', 'Sorry there was a problem processing your request! ' + err.message, 'error');
                    }
                    loadCurrentUserBalance(makeInitialTrustlines);
                    // submission has finalized with either an error or success.
                    // the transaction will not be retried after this point
                });

            } else {
                loadCurrentUserBalance();
                swal('Good job!', 'Congratulations ' + Auth.getCurrentUser().name + '! You created an new wallet! ' + destinationAddress, 'success');
            }
        };

        $scope.transferMoney = function () {
            swal({
                    title: 'Transfer money!',
                    text: 'Transfer ' + $scope.amountToTransfer + ' to the following address: ',
                    type: 'input',
                    showCancelButton: true,
                    closeOnConfirm: false,
                    inputPlaceholder: 'Write something'
                },
                function(inputValue){
                    if (inputValue === false) return false;

                    if (inputValue === "") {
                        swal.showInputError("You need to write something!");
                        return false
                    }
                    transferMoneyFromCurrentAccount(inputValue);
                });
        };

        $scope.createWallet = function () {
            var currentUser = $scope.getMyAccountUser();
            return Wallet.getByOwnerEmail({ownerEmail: currentUser.email}).$promise
                .then(function (data) {
                    if (data.length < 1) {
                        var saveWallet = function(newWallet){
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
                        newWallet.currency = "XRP";
                        if (currentUser.email === 'admin@admin.com') {
                            //reuse existing known wallet
                            newWallet.publicKey = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
                            newWallet.passphrase = 'masterpassphrase';
                            saveWallet(newWallet);
                            swal('Good job!', 'Congratulations ' + currentUser.name + '! You created an new wallet! ' + data.publicKey, 'success');
                        } else {
                            // generate new wallet
                            var wallet = ripple.Wallet.generate();
                            newWallet.publicKey = wallet.address;
                            newWallet.passphrase = wallet.secret;
                            saveWallet(newWallet);
                        }
                    }
                });
        };

        $scope.message = 'Not connected to any server';
        $scope.ledgerClosed = '';
        $scope.error = '';


        remote.connect(function () {
            console.log('Remote connected');

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
                $scope.$apply();
                loadCurrentUserBalance();
            });

            remote.on('transactions', function (foobar) {
                loadCurrentUserBalance();
                console.log('' + foobar);
            });

            remote.on('error', function (error) {
                $scope.error = error;
                $scope.$apply();
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
                $scope.$apply();
            });

            loadCurrentUserBalance();

        });
    });
