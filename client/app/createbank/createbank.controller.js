'use strict';

angular.module('riwebApp')
  .controller('CreatebankCtrl', function ($scope, $location, $rootScope, RiwebSocketService) {
    $scope.bank = {};

    $scope.register = function (form) {
      $scope.submitted = true;

      if (form.$valid) {
        RiwebSocketService.on('post:create_admin_user_for_bank', function (data) {
          if (data.status === 'success') {
            
            $rootScope.$broadcast('currentUser', data.user);
            
            $location.path('/myaccount');
          }
        });

        RiwebSocketService.emit('create_bank', $scope.bank);
      }

    };
  });
 