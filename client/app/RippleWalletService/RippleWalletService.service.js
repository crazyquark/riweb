'use strict';

angular.module('riwebApp')
    .service('RippleWalletService', function (RippleAccountService,
        Auth, socket, $log) {

        var walletInfo = {
            wallet: {}
        };

        var currentUser = Auth.getCurrentUser();

        function getCurrentUserWallet(callback) {
            currentUser = Auth.getCurrentUser();

            if (!currentUser.email) {
                return; // not logged in
            }

            socket.socket.on('post:create_wallet', function (rippleAddress) {
                socket.socket.removeAllListeners('post:create_wallet');
                walletInfo.wallet = rippleAddress;

                RippleAccountService.accountInfo.account = currentUser.name;
                RippleAccountService.accountInfo.iban = currentUser.iban;

                callback();
            });

            socket.socket.emit('create_wallet', { ownerEmail: currentUser.email, role: currentUser.role });
        }

        function loadCurrentUserBalance() {
            $log.debug('loadCurrentUserBalance');
            var user = Auth.getCurrentUser();

            if (!user.email) {
                return; // No user is logged in, please go away
            }

            socket.socket.on('post:list_transactions', function (result) {
                if (result.status === 'success') {
                    RippleAccountService.accountInfo.transactions = result.transactions;
                    if (console.table) {
                        console.log('post:list_transactions');
                        console.table(result.transactions);
                    }
                }
            });

            // socket.socket.emit('account_info', user.email);
            socket.socket.emit('list_transactions', user.email);
        }

        return {
            getCurrentUserWallet: getCurrentUserWallet,
            loadCurrentUserBalance: loadCurrentUserBalance,
            walletInfo: walletInfo
        };
    });
