'use strict';

angular.module('riwebApp')
  .controller('MyaccountCtrl', function ($scope, Auth, User) {
    var Remote = ripple.Remote;
    var remote = new Remote({
        // see the API Reference for available options
        servers: [ 'ws://localhost:6006' ]
    });

    $scope.getMyAccountUser = Auth.getCurrentUser;
    $scope.createWallet = function () {
        var currentUser = $scope.getMyAccountUser();
        if (currentUser.email === 'admin@admin.com') {
            currentUser.xrpWallet = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
        }
        if(!currentUser.passphrase){
            currentUser.passphrase = 'masterpassphrase';
        }
        return User.update(currentUser,
            function() {
                swal('Good job!', 'Congratulations ' + currentUser.name + '! You created an new wallet! ' + currentUser.xrpWallet, 'success');
                currentUser = User.get();
            },
            function() {
                swal('Error', 'Sorry there was a problem processing your request!', 'error');
            }.bind(this)).$promise;
    };

    $scope.message = 'Not connected to any server';
    $scope.ballance = '0 XRPs :(';
    $scope.ledgerClosed = '';
    $scope.error = '';


    remote.connect(function() {
        console.log('Remote connected');

        var streams = [
            'ledger',
            'transactions'
        ];

        var request = remote.requestSubscribe(streams);

        request.on('error', function(error) {
            console.log('request error: ', error);
        });


        // the `ledger_closed` and `transaction` will come in on the remote
        // since the request for subscribe is finalized after the success return
        // the streaming events will still come in, but not on the initial request
        remote.on('ledger_closed', function(ledger) {
            /*jshint camelcase: false */
            $scope.ledgerClosed = ledger.ledger_hash;
            $scope.$apply();
        });

        remote.on('error', function(error) {
            $scope.error = error;
            $scope.$apply();
        });

        // fire the request
        request.request();

        /* remote connected */
        remote.requestServerInfo(function(err, info) {
            /*jshint camelcase: false */
            var pubkeyNode = info.info.pubkey_node;
            if(pubkeyNode){
                $scope.message = 'Connected to server ' + pubkeyNode;
                $scope.server_name = pubkeyNode;
                $scope.server_error = '';
            } else {
                $scope.server_name = '';
                $scope.server_error = 'Error ' + err;
            }
            $scope.$apply();

        });
        remote.requestAccountInfo({account: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'}, function(err, info) {
            /*jshint camelcase: false */
            $scope.xrpBallance = info.account_data.Balance;
            $scope.$apply();
        });

    });
  });
