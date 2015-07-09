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
            loadBalance: function (walletPublicKey, callback) {
                RippleRemoteService.onRemotePresent(function (remote) {
                    var rootAddress = RIPPLE_ROOT_ACCOUNT.address;
                    if (walletPublicKey !== rootAddress) {
                        remote.requestRippleBalance(walletPublicKey, rootAddress, 'EUR', null, function (err, info) {
                            if(!err){
                                /*jshint camelcase: false */
                                accountInfo.balance = String(info.account_balance._value).replace(/"/g, '');
                                accountInfo.account = walletPublicKey; //info.account_data.Account;
                            } else {
                                accountInfo.balance = '0'; // Your ass is broke, dude
                                accountInfo.account = walletPublicKey;
                                console.error(err);
                            }
                            if(callback){
                                callback(accountInfo);
                            }
                        });
                    } else {
                        accountInfo.balance = 0;
                        accountInfo.account = walletPublicKey; //info.account_data.Account;
                    }

                    /*jshint camelcase: false */
                    remote.requestAccountTransactions({account: walletPublicKey, ledger_index_min: -1}, function (err, info) {
                        //delete old transactions first if they exist
                        if (accountInfo.transactions) {
                            delete accountInfo.transactions;
                        }
                        info.transactions.forEach(function (item) {

                            if (item.tx.Destination && item.tx.Amount.currency && item.meta.TransactionResult === 'tesSUCCESS') {
                                if (!accountInfo.transactions) {
                                    //make transactions lazy so we can have a relevant message
                                    accountInfo.transactions = [];
                                }
                                accountInfo.transactions.push(item);
                                if(callback){
                                    callback(accountInfo);
                                }
                            }
                        });
                    });
                });
            }
    };
});
