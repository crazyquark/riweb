'use strict';

angular.module('riwebApp')
  .controller('RealBankAccountRequestsCtrl', function ($scope, RealBankAccountRequestsService) {
    $scope.realBankAccountRequests = {};

    function init() {
      RealBankAccountRequestsService.query().$promise.then(function (allRequests) {
        $scope.realBankAccountRequests.requests = allRequests;
      });
    }

    init();
  });
