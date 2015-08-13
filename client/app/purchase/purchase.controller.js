'use strict';

angular.module('riwebApp')
  .controller('PurchaseCtrl', function ($scope, $routeParams, RippleTransactionService) {
    //private stuff
    function purchaseProduct(){
      RippleTransactionService.transferMoneyFromCurrentAccount($scope.purchase.price, $scope.purchase.merchantEmail);
    }

    //public stuff
    $scope.purchase = {
      merchantEmail: $routeParams.merchantEmail,
      price: $routeParams.price
    };
    $scope.purchaseProduct = purchaseProduct;
  });
