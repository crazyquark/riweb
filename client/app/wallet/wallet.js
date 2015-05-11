'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/wallet', {
        templateUrl: 'app/wallet/wallet.html',
        controller: 'WalletCtrl'
      });
  });
