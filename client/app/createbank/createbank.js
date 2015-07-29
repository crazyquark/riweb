'use strict';

angular.module('riwebApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/createbank', {
        templateUrl: 'app/createbank/createbank.html',
        controller: 'CreatebankCtrl'
      });
  });
