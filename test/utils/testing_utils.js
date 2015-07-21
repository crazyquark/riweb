var sinon = require('sinon');
var Q = require('q');

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
        createTransaction: sinon.stub(),
        requestAccountLines: sinon.stub(),
        _stub_transaction: {}
    };

    var transaction = buildEmptyTransactionStub();
    remoteStub.connect.yields(null);
    remoteStub.createTransaction.returns(transaction);
    remoteStub.requestAccountLines.yields(null, {lines:[]});

    remoteStub._stub_transaction = transaction;

    return  remoteStub;
}

function buildEmptyTransactionStub() {
    var transaction = {
        submit: sinon.stub(),
        setTrust: sinon.stub()
    };
    transaction.submit.yields(null, {});
    transaction.setTrust.yields(null, {});
    return transaction;
}

function getNonAdminRippleGeneratedWallet() {
    return {
        address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh',
        secret: 'NONADMINssphrase'
    }
}

function getNonAdminMongooseWallet(email_address, sufix) {
    email_address = email_address || 'joe@danger.io';
    sufix = sufix || '';
    return {
        ownerEmail: email_address,
        secret: 'NONADMINssphrase' + sufix,
        address: 'rNON_ADMIN4rj91VRWn96DkukG4bwdtyTh' + sufix
    };
}

function getAdminMongooseWallet() {
    return {
        ownerEmail: 'admin@admin.com',
        secret: 'masterpassphrase',
        address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    };
}

function buildFindByOwnerEmailForAdmin(wallet){
    sinon.stub(wallet, 'findByOwnerEmail').returns(Q({
        ownerEmail: 'admin@admin.com',
        secret: 'masterpassphrase',
        address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    }));
}

function buildCreateForEmailStub(wallet, email){
    sinon.stub(wallet, 'create').returns(Q([getNonAdminMongooseWallet(email)]));
}

function buildFindByOwnerEmailForUnexisting(wallet){
    sinon.stub(wallet, 'findByOwnerEmail').returns(Q({}));
}


exports.rootAccountAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
exports.buildSocketSpy = buildSocketSpy;
exports.buildRemoteStub = buildRemoteStub;
exports.buildCreateForEmailStub = buildCreateForEmailStub;
exports.buildEmptyTransactionStub = buildEmptyTransactionStub;
exports.getNonAdminRippleGeneratedWallet = getNonAdminRippleGeneratedWallet;
exports.getNonAdminMongooseWallet = getNonAdminMongooseWallet;
exports.getAdminMongooseWallet = getAdminMongooseWallet;
exports.buildFindByOwnerEmailForAdmin = buildFindByOwnerEmailForAdmin;
exports.buildFindByOwnerEmailForUnexisting = buildFindByOwnerEmailForUnexisting;
