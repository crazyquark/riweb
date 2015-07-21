'use strict';

angular.module('riwebApp')
    .service('RippleWalletService', function (RippleRemoteService, RippleAccountService,
        Auth, RIPPLE_ROOT_ACCOUNT, socket) {

        var walletInfo = {
            wallet: {}
        };

        var currentUser = Auth.getCurrentUser();

        function getCurrentUserWallet(callback) {
            currentUser = Auth.getCurrentUser();
            
            if (!currentUser.email) {
                return; // not logged in
            }
            
            socket.socket.on('post:create_wallet', function (err, rippleAddress) {
                socket.socket.removeAllListeners('post:create_wallet');
                if (!err) {
                    walletInfo.wallet = rippleAddress;

                    callback();
                } else {
                    walletInfo.wallet = {};
                    callback();
                    swal('Error', 'Sorry there was a problem processing your request!', 'error');
                }
            });
            socket.socket.emit('create_wallet', { ownerEmail: currentUser.email });
        }

        function loadCurrentUserBalance() {
            console.log('loadCurrentUserBalance');
            var user = Auth.getCurrentUser();
            
            if (!user.email) {
                return; // No user is logged in, please go away
            }
            
            socket.socket.on('post:account_info', function (accountInfo) {
                console.log('on.post:account_info');
                console.log(accountInfo);

                RippleAccountService.accountInfo.account = user.name;
                RippleAccountService.accountInfo.balance = accountInfo.balance;
            });
            socket.socket.emit('account_info', user.email);
        }

        return {
            getCurrentUserWallet: getCurrentUserWallet,
            loadCurrentUserBalance: loadCurrentUserBalance,
            walletInfo: walletInfo
        };
    });
