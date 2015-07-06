'use strict';

describe('Service: RippleAccountService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RippleAccountService;
  beforeEach(inject(function (_RippleAccountService_) {
    RippleAccountService = _RippleAccountService_;
  }));

  it('should do something', function () {
    expect(!!RippleAccountService).toBe(true);
  });

});
