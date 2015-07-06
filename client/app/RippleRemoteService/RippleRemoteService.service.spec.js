'use strict';

describe('Service: RippleRemoteService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RippleRemoteService;
  beforeEach(inject(function (_RippleRemoteService_) {
    RippleRemoteService = _RippleRemoteService_;
  }));

  it('should do something', function () {
    expect(!!RippleRemoteService).toBe(true);
  });

});
