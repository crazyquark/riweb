'use strict';

angular.module('riwebApp')
  .service('RippleRemoteService', function ($q) {
        var Remote = ripple.Remote;
        var remote = new Remote({
            // see the API Reference for available options
            servers: [ 'ws://localhost:6006' ]
        });

        var streams = [
            'ledger',
            'transactions',
            'random'
        ];

        /*jshint camelcase: false */
        var serverInfo = {
            errorMessage: '',
            ledgerClosed: '',
            message: '',
            server_name: '',
            server_error: ''
        };

        var deferred = $q.defer();
        var theRemote;


        function onErrorMessage(remote){
            remote.on('error', function (error) {
                serverInfo.errorMessage = error;
            });
        }
        function onLedgerClosed(remote){
            remote.on('ledger_closed', function (ledger) {
                /*jshint camelcase: false */
                serverInfo.ledgerClosed = ledger.ledger_hash;
            });
        }

        function requestServerInfo(remote){
            remote.requestServerInfo(function (err, info) {
                /*jshint camelcase: false */
                var pubkeyNode = info.info.pubkey_node;
                if (pubkeyNode) {
                    serverInfo.message = 'Connected to server ' + pubkeyNode;
                    serverInfo.server_name = pubkeyNode;
                    serverInfo.server_error = '';
                } else {
                    serverInfo.server_name = '';
                    serverInfo.server_error = 'Error ' + err;
                }
            });
        }


        remote.connect(function () {
            console.log('Remote connected');
            var request = remote.requestSubscribe(streams);

            onErrorMessage(remote);
            onLedgerClosed(remote);
            requestServerInfo(remote);

            // fire the request
            request.request();

            theRemote = remote;
            deferred.resolve(remote);
        });

        function onRemotePresent(callback){
            if(!theRemote){
                return deferred.promise.then(callback);
            } else {
                var newDeferred = $q.defer();
                newDeferred.resolve(theRemote);
                return newDeferred.promise.then(callback);
            }
        }

        return {
            remote: remote,
            onRemotePresent: onRemotePresent,
            serverInfo: serverInfo
        };
  });
