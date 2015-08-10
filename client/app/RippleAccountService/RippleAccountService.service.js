'use strict';

angular.module('riwebApp')
    .service('RippleAccountService', function () {
        var accountInfo = {};

        function resetAccount() {
            accountInfo.balance = '';
            accountInfo.account = '';
            accountInfo.iban = '';
            accountInfo.transactions = [];
        }

        resetAccount();

        return {
            accountInfo: accountInfo,
            resetAccount: resetAccount
        };
    });
