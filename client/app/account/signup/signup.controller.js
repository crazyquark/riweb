'use strict';

angular.module('riwebApp')
  .controller('SignupCtrl', function ($scope, Auth, $location, BankAccountService) {
    $scope.user = {};
    $scope.errors = {};

    $scope.availableBanks = [];

    $scope.listAvailableBanks = function() {
      BankAccountService.query().$promise.then(function(allBanks){
          $scope.availableBanks = allBanks;
          $scope.user.bank = $scope.availableBanks[0];
      });
    };

    $scope.listAvailableBanks();

    $scope.register = function(form) {
      $scope.submitted = true;

      if(form.$valid) {
        Auth.createUser({
          name: $scope.user.name,
          email: $scope.user.email,
          password: $scope.user.password,
          iban: $scope.user.iban,
          bank: $scope.user.bank._id
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
