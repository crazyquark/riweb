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

        var deferred = $q.defer();
        var theRemote;

        remote.connect(function () {

            console.log('Remote connected');
            var request = remote.requestSubscribe(streams);

            request.on('error', function (error) {
                console.log('request error: ', error);
            });

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
            connectPromise: deferred.promise,
            onRemotePresent: onRemotePresent
        };
  });
