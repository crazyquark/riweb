'use strict';

angular.module('riwebApp')
  .service('BankAccountService', function ($resource) {
    return $resource('/api/bankaccounts/:id',{});
  });
