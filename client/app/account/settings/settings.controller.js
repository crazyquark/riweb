'use strict';

angular.module('riwebApp')
  .controller('SettingsCtrl', function ($scope, User, Auth, BankAccountService, RiwebSocketService) {
    $scope.errors = {};

    $scope.changePassword = function (form) {
      $scope.submitted = true;
      if (form.$valid) {
        Auth.changePassword($scope.user.oldPassword, $scope.user.newPassword)
          .then(function () {
            $scope.message = 'Password successfully changed.';
          })
          .catch(function () {
            form.password.$setValidity('mongoose', false);
            $scope.errors.other = 'Incorrect password';
            $scope.message = '';
          });
      }
    };

    $scope.setTrust = {
      amountToTrust: 1000,
    };

    $scope.trustBank = function () {
      RiwebSocketService.emit('set_bank_trust', {
        bank: $scope.setTrust.bank
      });
    };

    $scope.availableBanks = [];

    function listAvailableBanks() {
      BankAccountService.query().$promise.then(function (allBanks) {
        $scope.availableBanks = allBanks;
        $scope.setTrust.bank = $scope.availableBanks[0];
      });
    }

    listAvailableBanks();

  });
