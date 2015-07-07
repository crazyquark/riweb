'use strict';

describe('Service: TrustLineService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var TrustLineService;
  beforeEach(inject(function (_trustLineService_) {
    TrustLineService = _trustLineService_;
  }));

  it('should do something', function () {
    expect(!!TrustLineService).toBe(true);
  });

});
