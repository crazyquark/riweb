'use strict';

angular.module('riwebApp')
  .service('RiwebSocketService', function (socket) {
    // function loggedEmit(args){
    //   $log.debug(' ===> emit(', args, ')');
    //   return socket.socket.emit(args);
    // }

    // function loggedOn(eventName, listenerFunction){
    //   function loggedListenerFunction(args){
    //     $log.debug(' <=== on(', eventName, args, ')');
    //     listenerFunction.call(args);
    //   }

    //   return socket.socket.on(eventName, loggedListenerFunction);
    // }

    return {
      on: socket.socket.on,
      emit: socket.socket.emit
    };

  });
