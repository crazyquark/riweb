'use strict';

angular.module('riwebApp')
  .controller('PurchaseCtrl', function ($scope, $routeParams, $q, Auth, RippleTransactionService, OrderRequestService) {
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
        RippleTransactionService.transferMoneyFromCurrentAccount($scope.purchase.price, $scope.purchase.merchantEmail, currentUser, 
                                                                  $routeParams.orderRequestId, $scope.returnUrl, $scope.cancelUrl);
      });
    }

    //public stuff
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.purchase = {};
    
    function loadOrderRequest(orderRequestId){
      OrderRequestService.get({id: orderRequestId}).$promise.then(function(orderRequest){
        $scope.purchase.merchantEmail = orderRequest.receiverEmail;
        $scope.purchase.price = orderRequest.amount;
        
        $scope.returnUrl = orderRequest.returnUrl;
        $scope.cancelUrl = orderRequest.cancelUrl;
      });
    }
    loadOrderRequest($routeParams.orderRequestId);
    $scope.purchaseProduct = purchaseProduct;
  });
