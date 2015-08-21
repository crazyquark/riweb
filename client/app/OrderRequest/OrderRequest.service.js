'use strict';

angular.module('riwebApp')
  .service('OrderRequestService', function ($resource) {
    return $resource('/api/order_requests/:id',{});
  });
