'use strict';

describe('Controller: RealBankAccountRequestsCtrl', function () {

  // load the controller's module
  beforeEach(module('riwebApp'));

  var RealBankAccountRequestsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RealBankAccountRequestsCtrl = $controller('RealBankAccountRequestsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
