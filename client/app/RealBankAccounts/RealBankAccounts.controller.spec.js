'use strict';

describe('Controller: RealBankAccountsCtrl', function () {

  // load the controller's module
  beforeEach(module('riwebApp'));

  var RealBankAccountsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RealBankAccountsCtrl = $controller('RealBankAccountsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
