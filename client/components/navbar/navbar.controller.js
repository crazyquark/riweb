'use strict';

angular.module('riwebApp')
  .controller('NavbarCtrl', function ($scope, $location, Auth, OrderRequestService) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    }];

    $scope.isCollapsed = true;
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;

    $scope.logout = function () {
      Auth.logout();
      $location.path('/login');
    };

    $scope.isActive = function (route) {
      return route === $location.path();
    };

    $scope.checkout = function () {
      OrderRequestService.save({
        receiverEmail: 'alice@alpha.com',
        amount: 2,
        details: 'Peanuts!'
      }).$promise.then(function (orderRequestResp) {
        $location.path('/purchase').search({
          orderRequestId: orderRequestResp.orderRequestId
        });
      });
    }

  });