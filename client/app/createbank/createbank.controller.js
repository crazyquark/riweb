'use strict';

angular.module('riwebApp')
  .controller('CreatebankCtrl', function ($scope, $location, RiwebSocketService) {
    $scope.bank = {};

    $scope.register = function (form) {
      $scope.submitted = true;

      if (form.$valid) {
        RiwebSocketService.on('post:create_admin_user_for_bank', function (data) {
          if (data.status === 'success') {
            $scope.user = data.user;
            $location.path('/myaccount');
          }
        });

        RiwebSocketService.emit('create_bank', $scope.bank);
      }

    };
  });
 