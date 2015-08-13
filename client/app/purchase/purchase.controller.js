'use strict';

angular.module('riwebApp')
  .controller('PurchaseCtrl', function ($scope, $routeParams, $q, Auth, RippleTransactionService) {
    //private stuff
    function makeSureIsLoggedIn(){
      var deferred = $q.defer();
      if(Auth.isLoggedIn()) {
        console.log('currentUser ', Auth.getCurrentUser());
        deferred.resolve(Auth.getCurrentUser());
      } else {
        Auth.login({
          email: $scope.purchase.email,
          password: $scope.purchase.password
        }).then(function(currentUser) {
          console.log('currentUser ', currentUser);
          deferred.resolve(currentUser);
        });
      }
      return deferred.promise;
    }

    function purchaseProduct(){
      makeSureIsLoggedIn().then(function(currentUser){
        RippleTransactionService.transferMoneyFromCurrentAccount($scope.purchase.price, $scope.purchase.merchantEmail, currentUser);
      });
    }

    //public stuff
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.purchase = {
      merchantEmail: $routeParams.merchantEmail,
      price: $routeParams.price
    };
    $scope.purchaseProduct = purchaseProduct;
  });
