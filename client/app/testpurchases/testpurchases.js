'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/testpurchases', {
        templateUrl: 'app/testpurchases/testpurchases.html',
        controller: 'TestpurchasesCtrl'
      });
  });
