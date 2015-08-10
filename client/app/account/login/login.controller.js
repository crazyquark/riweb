'use strict';

angular.module('riwebApp')
  .controller('LoginCtrl', function ($scope, $rootScope, $http, Auth, $location) {
    $scope.user = {};
    $scope.errors = {};
    
    $scope.message = $rootScope.message;
    
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
          console.error(err);
          $scope.errors.other = err.message;
        });
      }
    };

  });
