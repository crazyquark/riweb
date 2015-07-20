'use strict';

angular.module('riwebApp')
    .service('RippleAccountService', function (RippleRemoteService, RIPPLE_ROOT_ACCOUNT) {
        var accountInfo = {};

        function resetAccount() {
            accountInfo.balance = '';
            accountInfo.account = '';
            accountInfo.transactions = [];
        }

        resetAccount();

        return {
            accountInfo: accountInfo,
            resetAccount: resetAccount,
            loadBalance: function (walletPublicKey, callback) { }
    };
});
