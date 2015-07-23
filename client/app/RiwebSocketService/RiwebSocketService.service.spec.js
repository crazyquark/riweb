'use strict';

describe('Service: RiwebSocketService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RiwebSocketService;
  beforeEach(inject(function (_RiwebSocketService_) {
    RiwebSocketService = _RiwebSocketService_;
  }));

  it('should do something', function () {
    expect(!!RiwebSocketService).toBe(true);
  });

});
