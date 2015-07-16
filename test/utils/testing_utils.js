var sinon = require('sinon');

function buildSocketSpy() {
    return {
        emit: sinon.spy(),
        on: sinon.spy()
    };

}

function buildRemoteStub() {
    var remoteStub = {
        connect: sinon.stub(),
        setSecret: sinon.stub(),
        createTransaction: sinon.stub()
    };

    var transaction = buildEmptyTransactionStub();
    remoteStub.connect.yields(null);
    remoteStub.createTransaction.returns(transaction);

    return  remoteStub;
}

function buildEmptyTransactionStub() {
    var transaction = {submit: sinon.stub()};
    transaction.submit.yields(null, {});
    return transaction;
}

function getNonAdminRippleGeneratedWallet() {
    return {
        address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
        secret: 'NONADMINssphrase'
    }
}

function getNonAdminMongooseWallet(email_address) {
    return {
        ownerEmail: email_address,
        passphrase: 'NONADMINssphrase',
        publicKey: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh'
    };
}

function getAdminMongooseWallet() {
    return {
        ownerEmail: "admin@admin.com",
        passphrase: "masterpassphrase",
        publicKey: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
    };
}

exports.buildSocketSpy = buildSocketSpy;
exports.buildRemoteStub = buildRemoteStub;
exports.buildEmptyTransactionStub = buildEmptyTransactionStub;
exports.getNonAdminRippleGeneratedWallet = getNonAdminRippleGeneratedWallet;
exports.getNonAdminMongooseWallet = getNonAdminMongooseWallet;
exports.getAdminMongooseWallet = getAdminMongooseWallet;