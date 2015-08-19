'use strict';

angular.module('riwebApp')
  .controller('TestpurchasesCtrl', function ($scope, $location, OrderRequestService) {

    $scope.checkout = function (amount, receiverEmail) {
      OrderRequestService.save({
        receiverEmail: receiverEmail,
        amount: amount,
        details: 'Peanuts!'
      }).$promise.then(function (orderRequestResp) {
        $location.path('/purchase').search({
          orderRequestId: orderRequestResp.orderRequestId
        });
      });
    };
 
  });
