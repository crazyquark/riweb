'use strict';

describe('Service: FormattingService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var FormattingService;
  beforeEach(inject(function (_FormattingService_) {
    FormattingService = _FormattingService_;
  }));

  it('should do something', function () {
    expect(!!FormattingService).toBe(true);
  });

});
