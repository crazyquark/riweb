'use strict';

angular.module('riwebApp')
  .controller('BankTrustCtrl', function ($scope, Auth, BankAccountService) {
    $scope.bankAccounts = {};

    function init() {
      var currentUser = Auth.getCurrentUser();

      BankAccountService.query().$promise.then(function (bankAccounts) {
        $scope.bankAccounts.banks = [] ;

        bankAccounts.forEach(function(bank) {
          // Skip self
          if (currentUser.bank !== bank._id) {
            $scope.bankAccounts.banks.push(bank);
          }
        });
      });
    }

    $scope.setTrust = {
      amountToTrust: 1000
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

    init();
  });
