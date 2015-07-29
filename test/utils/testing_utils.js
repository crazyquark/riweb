var sinon = require('sinon');
var Q = require('q');
var Wallet = require('./../../server/api/wallet/wallet.model');
var Utils = require('./../../server/utils/utils');
var config = require('../../server/config/environment');
var mongoose = require('mongoose-q')(require('mongoose'));

// Add debugging
var debug = require('debug')('mongodb');
mongoose.set('debug', debug);

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
        requestAccountTransactions: sinon.stub(),
        _stub_transaction: {}
    };

    var transaction = buildEmptyTransactionStub();
    remoteStub.connect.yields(null);
    remoteStub.createTransaction.returns(transaction);
    remoteStub.requestAccountLines.yields(null, { lines: [] });

    remoteStub._stub_transaction = transaction;

    return remoteStub;
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

function buildFindByOwnerEmailForAdmin(wallet) {
    sinon.stub(wallet, 'findByOwnerEmail').returns(Q({
        ownerEmail: 'admin@admin.com',
        secret: 'masterpassphrase',
        address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    }));
}

function buildCreateForEmailStub(wallet, email) {
    sinon.stub(wallet, 'create').returns(Q([getNonAdminMongooseWallet(email)]));
}

function buildFindByOwnerEmailForUnexisting(wallet) {
    sinon.stub(wallet, 'findByOwnerEmail').returns(Q({}));
}

function buildGenericSpy(objectToSpyOn, methods) {
    methods.forEach(function (methodName) {
        sinon.spy(objectToSpyOn, methodName);
    });
}

function restoreGenericSpy(objectToRestoreSpy, methods) {
    methods.forEach(function (methodName) {
        if (objectToRestoreSpy[methodName].restore) {
            objectToRestoreSpy[methodName].restore();
        }
    });
}

function buildWalletSpy() {
    buildGenericSpy(Wallet, ['create']);
}

function restoreWalletSpy() {
    restoreGenericSpy(Wallet, ['create', 'findByOwnerEmail', 'findByRippleAddress']);
}

function buildNewConnectedRemoteStub() {
    Utils.getNewConnectedRemote = sinon.stub().returns(Q(buildRemoteStub()));
    Utils.getNewConnectedAdminRemote = sinon.stub().returns(Q(buildRemoteStub()));
}

function dropMongodbDatabase() {
    var deferred = Q.defer();

    var connection = mongoose.createConnection(config.mongo.uri, config.mongo.options);

    connection.on('open', function () {
        connection.db.dropDatabase(function (err, result) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });
    });

    return deferred.promise;
}

exports.rootAccountAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
exports.dropMongodbDatabase = dropMongodbDatabase;
exports.buildSocketSpy = buildSocketSpy;
exports.buildRemoteStub = buildRemoteStub;
exports.buildWalletSpy = buildWalletSpy;
exports.restoreWalletSpy = restoreWalletSpy;
exports.buildNewConnectedRemoteStub = buildNewConnectedRemoteStub;
exports.buildCreateForEmailStub = buildCreateForEmailStub;
exports.buildEmptyTransactionStub = buildEmptyTransactionStub;
exports.getNonAdminRippleGeneratedWallet = getNonAdminRippleGeneratedWallet;
exports.getNonAdminMongooseWallet = getNonAdminMongooseWallet;
exports.getAdminMongooseWallet = getAdminMongooseWallet;
exports.buildFindByOwnerEmailForAdmin = buildFindByOwnerEmailForAdmin;
exports.buildFindByOwnerEmailForUnexisting = buildFindByOwnerEmailForUnexisting;
