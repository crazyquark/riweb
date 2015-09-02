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

    init();
  });
