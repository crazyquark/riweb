'use strict';

angular.module('riwebApp')
  .service('RiwebSocketService', function (socket, $log) {
    function loggedEmit(args){
      $log.debug(' ===> emit(', args, ')');
      return socket.socket.emit(args);
    }

    function loggedOn(eventName, listenerFunction){
      return socket.socket.on(eventName, loggedListenerFunction);

      function loggedListenerFunction(args){
        $log.debug(' <=== on(', eventName, args, ')');
        listenerFunction.call(args);
      }
    }

    return {
      on: loggedOn,
      emit: loggedEmit
    }

  });
