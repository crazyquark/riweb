'use strict';

angular.module('riwebApp')
  .service('RealBankAccountsService', function ($resource) {
    return $resource('/realbankapi/RealBankAccounts/:id',{});
  });
