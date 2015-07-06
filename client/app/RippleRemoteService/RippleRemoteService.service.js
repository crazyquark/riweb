'use strict';

angular.module('riwebApp')
  .service('RippleRemoteService', function ($q) {
        var Remote = ripple.Remote;
        var remote = new Remote({
            // see the API Reference for available options
            servers: [ 'ws://localhost:6006' ]
        });

        var deferred = $q.defer();
        var theRemote;

        remote.connect(function () {
            console.log('Remote connected');
            theRemote = remote;
            deferred.resolve(remote);
        });

        function onRemotePresent(){
            if(!theRemote){
                return deferred.promise;
            } else {
                var newDeferred = $q.defer();
                newDeferred.resolve(theRemote);
                return newDeferred.promise;
            }
        }

        return {
            remote: remote,
            connectPromise: deferred.promise,
            onRemotePresent: onRemotePresent
        };
  });
