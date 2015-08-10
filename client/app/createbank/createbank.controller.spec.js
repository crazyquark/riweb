'use strict';

describe('Controller: CreatebankCtrl', function () {

  // load the controller's module
  beforeEach(module('riwebApp'));

  var CreatebankCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CreatebankCtrl = $controller('CreatebankCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
