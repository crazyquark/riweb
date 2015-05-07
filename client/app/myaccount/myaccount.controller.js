'use strict';

angular.module('riwebApp')
  .controller('MyaccountCtrl', function ($scope, Auth) {
    $scope.getMyAccountUser = Auth.getCurrentUser;
    $scope.createWallet = function () {
        swal("Good job!", "You created an new wallet!", "success")
    };

    $scope.message = 'Not connected to any server';

    var Remote = ripple.Remote;
    var remote = new Remote({
        // see the API Reference for available options
        servers: [ 'wss://s1.ripple.com:443' ]
//        servers: [ 'wss://localhost:6006' ]
    });

    remote.connect(function() {
        /* remote connected */
        remote.requestServerInfo(function(err, info) {
            if(info.info.pubkey_node){
                $scope.message = 'Connected to server ' + info.info.pubkey_node;
            } else {
                $scope.message = 'Error ' + err;
            }
            $scope.$apply();

        });
    });
  });
