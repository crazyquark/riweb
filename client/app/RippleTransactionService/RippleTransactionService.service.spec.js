'use strict';

describe('Service: RippleTransactionService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var RippleTransactionService;
  beforeEach(inject(function (_RippleTransactionService_) {
    RippleTransactionService = _RippleTransactionService_;
  }));

  it('should do something', function () {
    expect(!!RippleTransactionService).toBe(true);
  });

});
