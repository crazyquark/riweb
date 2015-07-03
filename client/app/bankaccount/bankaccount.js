'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/bankaccount', {
        templateUrl: 'app/bankaccount/bankaccount.html',
        controller: 'BankaccountCtrl'
      });
  });
