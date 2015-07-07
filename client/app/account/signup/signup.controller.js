'use strict';

angular.module('riwebApp')
  .controller('SignupCtrl', function ($scope, Auth, $location) {
    $scope.user = {};
    $scope.errors = {};

    $scope.availableBanks = [];

    $scope.listAvailableBanks = function() {
      $scope.availableBanks = [
        {name: 'abnamro', info: 'ABN Amro'},
        {name: 'ing', info: 'ING Bank N.V.'}
        ];
      $scope.user.bank = $scope.availableBanks[0];
      // TODO CS Extract from DB the list of banks available
    };

    $scope.listAvailableBanks();

    $scope.register = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.createUser({
          name: $scope.user.name,
          email: $scope.user.email,
          password: $scope.user.password,
          bank: 'ing'// TODO CS: Hardcode for now, should link to $scope.user.bank
        })
        .then( function() {
          // Account created, redirect to home
          $location.path('/myaccount');
        })
        .catch( function(err) {
          err = err.data;
          $scope.errors = {};

          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, function(error, field) {
            form[field].$setValidity('mongoose', false);
            $scope.errors[field] = error.message;
          });
        });
      }
    };

  });
