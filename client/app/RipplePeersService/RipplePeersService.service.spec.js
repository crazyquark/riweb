'use strict';

describe('Service: RipplePeersService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RipplePeersService;
  beforeEach(inject(function (_RipplePeersService_) {
    RipplePeersService = _RipplePeersService_;
  }));

  it('should do something', function () {
    expect(!!RipplePeersService).toBe(true);
  });

});
