'use strict';

angular.module('riwebApp')
    .service('RippleWalletService', function (RippleRemoteService, RippleAccountService, TrustLineService,
                                              Auth, RIPPLE_ROOT_ACCOUNT, socket) {

        var walletInfo = {
            wallet: {}
        };

        var theRemote;
        var currentUser = Auth.getCurrentUser();

        function showTransactionResultMessage(err) {
            if (err) {
                swal('Error', 'Failed to set the DefaultRipple flag on the cold wallet account: ' + err.message, 'error');
            }
            else {
                swal('Info', 'Set the DefaultRipple flag on the cold wallet account', 'info');
            }
        }

        function getCurrentUserWallet(callback){
            currentUser = Auth.getCurrentUser();

            socket.socket.on('post:create_wallet', function(err, rippleAddress){
              socket.socket.removeAllListeners('post:create_wallet');
              if(!err){
                walletInfo.wallet = rippleAddress;

                callback();
              } else {
                walletInfo.wallet = {};
                callback();
                swal('Error', 'Sorry there was a problem processing your request!', 'error');
              }
            });
            socket.socket.emit('create_wallet', {ownerEmail: currentUser.email})
        }

        function setAccountFlagsForAdmin(err, flags) {
            if (err) {
                swal('Error', 'There was an error communicating with the server: ' + err.message, 'error');
            }
            else {
                /*jshint bitwise: false*/
                if (!(flags & 0x00800000)) {
                    // OK, let's set the DefaultRipple flag if it's not there
                    theRemote.setSecret(RIPPLE_ROOT_ACCOUNT.address, RIPPLE_ROOT_ACCOUNT.secret);

                    var transaction = theRemote.createTransaction('AccountSet', {
                        account: RIPPLE_ROOT_ACCOUNT.address,
                        set: 'DefaultRipple'
                    });

                    transaction.submit(showTransactionResultMessage);

                } else {
                    console.log('The admin account wallet has the DefaultRipple flag active, flags are: ' + flags);
                }
            }
        }

        function checkColdWalletFlagsWithRemote(remote) {
            theRemote = remote;

            var reqOptions = {
                account: RIPPLE_ROOT_ACCOUNT.address,
                ledger: 'validated'
            };

            theRemote.requestAccountFlags(reqOptions, setAccountFlagsForAdmin);
        }

        function checkColdWalletFlags() {
            RippleRemoteService.onRemotePresent(checkColdWalletFlagsWithRemote);
        }

        function loadCurrentUserBalance() {
            console.log('loadCurrentUserBalance');
            RippleAccountService.resetAccount();
            socket.socket.on('post:account_info', function(account) {
              console.log('on.post:account_info');
              console.log(account);
              // walletInfo.wallet.balance = account.balance;
            });
            socket.socket.emit('account_info', Auth.getCurrentUser().email);
        }

        /*function generateNewWallet(callback) {
            socket.socket.on('post:create_wallet', function(err, rippleAddress){
              socket.socket.removeAllListeners('post:create_wallet');
              if(!err){
                walletInfo.wallet = rippleAddress;

                callback();

                // TODO move to server
                RippleRemoteService.onRemotePresent(function (remote) {
                    var makeInitialTrustLines = TrustLineService.buildMakeInitialTrustLines(walletInfo, remote);
                    var destinationAddress = RIPPLE_ROOT_ACCOUNT.address;
                    makeInitialTrustLines(destinationAddress);
                });
              } else {
                walletInfo.wallet = {};
                swal('Error', 'Sorry there was a problem processing your request!', 'error');
              }
            });
            socket.socket.emit('create_wallet', {ownerEmail: currentUser.email});
        }*/

        /*function reuseAdminWallet() {
            var newWallet = {};
            newWallet.ownerEmail = currentUser.email;
            //reuse existing known wallet
            newWallet.publicKey = RIPPLE_ROOT_ACCOUNT.address;
            newWallet.passphrase = RIPPLE_ROOT_ACCOUNT.secret;
            //TODO implement saveWallet
//            saveWallet(newWallet);
            checkColdWalletFlags();
        }

        function generateWalletIfMissing(existingWalletFound) {
            if (existingWalletFound.length < 1) {
                if (currentUser.role === 'admin') {
                    reuseAdminWallet();
                } else {
                    generateNewWallet();
                }
            }
        }

        function createWallet() {
            console.log('Creating wallet');
            if (currentUser) {
                if (currentUser.email !== walletInfo.makingWalletForEmail) {
                    walletInfo.makingWalletForEmail = currentUser.email;
                    getCurrentUserWallet(generateWalletIfMissing);
                }
            }
        }*/

        return {
            getCurrentUserWallet: getCurrentUserWallet,
            //createWallet: createWallet,
            loadCurrentUserBalance: loadCurrentUserBalance,
            walletInfo: walletInfo
        };
    });
