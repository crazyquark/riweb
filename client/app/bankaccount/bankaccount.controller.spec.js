'use strict';

describe('Controller: BankaccountCtrl', function () {

  // load the controller's module
  beforeEach(module('riwebApp'));

  var BankaccountCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BankaccountCtrl = $controller('BankaccountCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
