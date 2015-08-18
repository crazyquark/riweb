'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/purchase', {
        templateUrl: 'app/purchase/purchase.html',
        controller: 'PurchaseCtrl'
      });
  });
