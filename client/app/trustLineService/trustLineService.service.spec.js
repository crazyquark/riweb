'use strict';

describe('Service: trustLineService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var trustLineService;
  beforeEach(inject(function (_trustLineService_) {
    trustLineService = _trustLineService_;
  }));

  it('should do something', function () {
    expect(!!trustLineService).toBe(true);
  });

});
