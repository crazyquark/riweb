'use strict';

angular.module('riwebApp')
  .controller('MyaccountCtrl', function ($scope, Auth) {
    $scope.getMyAccountUser = Auth.getCurrentUser;
    $scope.createWallet = function () {
        swal("Good job!", "You created an new wallet!", "success")
    };

    $scope.message = 'Not connected to any server';
    $scope.ballance = '0 XRPs :(';
    $scope.ledger_closed = '';
    $scope.error = '';

    var Remote = ripple.Remote;
    var remote = new Remote({
        // see the API Reference for available options
        servers: [ 'ws://localhost:6006' ]
    });

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
            $scope.ledger_closed = ledger.ledger_hash;
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
            if(info.info.pubkey_node){
                $scope.message = 'Connected to server ' + info.info.pubkey_node;
            } else {
                $scope.message = 'Error ' + err;
            }
            $scope.$apply();

        });
        remote.requestAccountInfo({account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"}, function(err, info) {
            $scope.ballance = info.account_data.Balance;
            $scope.$apply();
        });

    });
  });
