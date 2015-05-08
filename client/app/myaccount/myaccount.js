'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/myaccount', {
        templateUrl: 'app/myaccount/myaccount.html',
        controller: 'MyaccountCtrl'
      });
  });
