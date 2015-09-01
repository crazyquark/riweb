'use strict';

angular.module('riwebApp')
  .service('RealBankAccountRequestsService', function ($resource) {
    return $resource('/realbankapi/RealBankAccountRequests/:id',{});
  });
