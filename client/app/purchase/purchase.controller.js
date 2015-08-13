'use strict';

angular.module('riwebApp')
  .controller('PurchaseCtrl', function ($scope, $routeParams) {
    //$scope.message = 'Hello';
    $scope.purchase = {
      merchantEmail: $routeParams.merchantEmail,
      price: $routeParams.price
    };
  });
