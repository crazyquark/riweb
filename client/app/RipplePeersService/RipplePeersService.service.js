'use strict';

angular.module('riwebApp')
    .service('RipplePeersService', function (RippleRemoteService) {
        return {
            refreshPeers: function ($scope) {
                RippleRemoteService.onRemotePresent(function (remote) {
                    remote.requestPeers(function (error, info) {
                        if(info && info.peers){
                            $scope.peers = info.peers;
                        } else {
                            $scope.peers = undefined;
                        }
                        _.defer(function () {
                            $scope.$apply();
                        });
                    });
                });
            }
        };
    });
