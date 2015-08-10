'use strict';

describe('Service: BankAccountService', function () {

  // load the service's module
  beforeEach(module('riwebApp'));

  // instantiate service
  var BankAccount;
  beforeEach(inject(function (_BankAccount_) {
    BankAccount = _BankAccount_;
  }));

  it('should do something', function () {
    expect(!!BankAccount).toBe(true);
  });

});
