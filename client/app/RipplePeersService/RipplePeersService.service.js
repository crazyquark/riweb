'use strict';

angular.module('riwebApp')
    .service('RipplePeersService', function (RippleRemoteService) {
        var peersInfo = {
            peers: []
        };
        return {
            refreshPeers: function (callback) {
                RippleRemoteService.onRemotePresent(function (remote) {
                    remote.requestPeers(function (error, info) {
                        if(info && info.peers){
                            peersInfo.peers = info.peers;
                        } else {
                            peersInfo.peers = undefined;
                        }
                        if(callback){
                            callback(peersInfo);
                        }
                    });
                });
            },
            peersInfo: peersInfo
        };
    });
