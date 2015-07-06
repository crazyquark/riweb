'use strict';

describe('Service: RippleWalletService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RippleWalletService;
  beforeEach(inject(function (_RippleWalletService_) {
    RippleWalletService = _RippleWalletService_;
  }));

  it('should do something', function () {
    expect(!!RippleWalletService).toBe(true);
  });

});
