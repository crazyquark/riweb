'use strict';

describe('Controller: MyaccountCtrl', function () {

  // load the controller's module
  beforeEach(module('riwebApp'));

  var MyaccountCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MyaccountCtrl = $controller('MyaccountCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
