'use strict';

angular.module('riwebApp')
  .controller('LoginCtrl', function ($scope, $http, Auth, $location, socket) {
    $scope.newComment = '';

    // Clean up listeners when the controller is destroyed
    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('comment');
    });

    socket.socket.on('post:create_wallet', function(ripple_address){
      console.log('Created wallet with ' + ripple_address);
    });

    // Use our rest api to post a new comment
    $scope.addComment = function() {

      socket.socket.emit('create_wallet', {ownerEmail: $scope.newComment});

      $scope.newComment = '';
    };





    $scope.user = {};
    $scope.errors = {};

    $scope.login = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.login({
          email: $scope.user.email,
          password: $scope.user.password
        })
        .then( function() {
          // Logged in, redirect to home
          $location.path('/myaccount');
        })
        .catch( function(err) {
          $scope.errors.other = err.message;
        });
      }
    };

  });
