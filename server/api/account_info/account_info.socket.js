/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var ripple = require('ripple-lib');
var Utils = require('./../../utils/utils');
var Q = require('q');
var Wallet = require('./../wallet/wallet.model');
var create_wallet = require('./../create_wallet/create_wallet.socket');

function remoteRequestAccountLines(rippleAddress, remote){
  var deferred = Q.defer();
  var options = {
    account: rippleAddress,
    ledger: 'validated'
  };
  remote.requestAccountLines(options, function(err, info) {
    if(!err){
      deferred.resolve(info);
    } else {
      deferred.reject(err);
    }
  });
  return deferred.promise;
}


function getRippleAccountInfo(rippleAddress) {
  var deferred = Q.defer();

  Utils.getNewConnectedRemote()
    .then(function(remote){
      remoteRequestAccountLines(rippleAddress, remote).then(function(info){
        deferred.resolve(info);
      });
    }).catch(function(err){
      console.error(err);
      deferred.reject(err);
    });
  return deferred.promise;
}

function getAccountInfo(ownerEmail, socket) {
  return Wallet.findByOwnerEmail(ownerEmail).then(function(foundWallet) {
      var deferred = Q.defer();

     if (foundWallet && foundWallet.address) { // There should be only one
        getRippleAccountInfo(foundWallet.address).then(function(rippleAccountInfo) {
          var accountLines = {
            balance: rippleAccountInfo.lines.length > 0 ? rippleAccountInfo.lines[0].balance : 0
          };

          Utils.emitEvent('post:account_info', accountLines);
          deferred.resolve(accountLines);
        }).catch(function(err){
          console.error(err);
          deferred.reject(err);
        });
      } else {
        Utils.emitEvent('post:account_info', {info: 'User does not exist!'});
        deferred.resolve({info: 'User does not exist!'});
      }
      return deferred.promise;
  });
}


exports.getAccountInfo = getAccountInfo;

exports.register = function(socket, clientEventEmitter) {

  clientEventEmitter.forwardFromEventEmitterToSocket('post:account_info', socket);

  socket.on('account_info', function(ownerEmail) {
    console.log('account_info ' + ownerEmail);
    getAccountInfo(ownerEmail, socket);
  });
};
