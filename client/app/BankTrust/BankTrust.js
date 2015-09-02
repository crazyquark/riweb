'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/BankTrust', {
        templateUrl: 'app/BankTrust/BankTrust.html',
        controller: 'BankTrustCtrl'
      });
  });
