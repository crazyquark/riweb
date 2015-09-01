'use strict';

angular.module('riwebApp')
    .controller('RealBankAccountsCtrl', function ($scope, RealBankAccountsService) {
    $scope.realBankAccounts = {};
    
    function init() {
      RealBankAccountsService.query().$promise.then(function(allAccounts){
          $scope.realBankAccounts.accounts = allAccounts;
      });
    }
    
    init();
    
  });
