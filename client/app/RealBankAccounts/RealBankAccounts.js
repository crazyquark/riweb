'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/RealBankAccounts', {
        templateUrl: 'app/RealBankAccounts/RealBankAccounts.html',
        controller: 'RealBankAccountsCtrl'
      });
  });
