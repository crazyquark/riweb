/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Bankaccount = require('./bankaccount.model');
var Wallet = require('../wallet/wallet.model');
var CreateBank = require('../create_bank/create_bank.socket');
var CreateAdminUserForBank = require('../create_admin_user_for_bank/create_admin_user_for_bank.socket');

function createAdminInfo(bankInfo) {
    return {
        bankId: bankInfo._id,
        info: bankInfo.info,
        email: bankInfo.email,
        password: bankInfo.email
    };
}

function createUserForBank(user, bankAdmin) {
    return User.create({
        provider: 'local',
        name: user.name,
        email: user.email,
        password: user.email,
        iban: user.iban,
        bank: bankAdmin.bank
    }).then(function (newUser) {
        return CreateWallet.createWalletForEmail(newUser.email, 'user');
    });
}

function createBank(bank) {
    return CreateBank.createBank(bank).then(function (bankInfo) {
        bank.bankInfo = bankInfo;
        return CreateAdminUserForBank.createAdminUserForBank(createAdminInfo(bankInfo));
    });
}

exports.createBank = createBank;
exports.createUserForBank = createUserForBank;

exports.register = function(socket) {
  Bankaccount.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Bankaccount.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
};

function onSave(socket, doc, cb) {
  socket.emit('bankaccount:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('bankaccount:remove', doc);
}
