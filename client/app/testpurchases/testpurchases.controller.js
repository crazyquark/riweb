'use strict';

angular.module('riwebApp')
  .controller('TestpurchasesCtrl', function ($scope, $location, OrderRequestService) {

    $scope.checkout = function (amount, receiverEmail) {
      OrderRequestService.save({
        receiverEmail: receiverEmail,
        amount: amount,
        returnUrl: '/myaccount',
        cancelUrl: '/testpurchases',
        details: 'Peanuts!'
      }).$promise.then(function (orderRequestResp) {
        $location.path('/purchase').search({
          orderRequestId: orderRequestResp.orderRequestId
        });
      });
    };
 
  });
