'use strict';

angular.module('riwebApp')
  .controller('MyaccountCtrl', function ($scope, Auth) {
    $scope.message = 'Hello';
    $scope.getMyAccountUser = Auth.getCurrentUser;
    $scope.createWallet = function () {
        alert('hello');
    };
  });
