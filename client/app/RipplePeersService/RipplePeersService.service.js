'use strict';

angular.module('riwebApp')
    .service('RipplePeersService', function (RippleRemoteService) {
        var peersInfo = {
            peers: []
        };
        return {
            refreshPeers: function () {
                RippleRemoteService.onRemotePresent(function (remote) {
                    remote.requestPeers(function (error, info) {
                        if(info && info.peers){
                            peersInfo.peers = info.peers;
                        } else {
                            peersInfo.peers = undefined;
                        }
                        peersInfo.peers = [{address:'foo', ledger:'bar'}];
                    });
                });
            },
            peersInfo: peersInfo
        };
    });
