'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/RealBankAccountRequests', {
        templateUrl: 'app/RealBankAccountRequests/RealBankAccountRequests.html',
        controller: 'RealBankAccountRequestsCtrl'
      });
  });
