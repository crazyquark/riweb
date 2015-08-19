var sinon = require('sinon');
var Q = require('q');
var Wallet = require('./../../server/api/wallet/wallet.model');
var BankAccount = require('./../../server/api/bankaccount/bankaccount.model');
var RealBankAccount = require('../../server/api/RealBankAccount/RealBankAccount.model');
var User = require('../../server/api/user/user.model');
var Utils = require('./../../server/utils/utils');
var config = require('../../server/config/environment');
var mongoose = require('mongoose-q')(require('mongoose'));

var io = require('socket.io');
var ripple = require('ripple-lib');

// Add debugging
var mongodbDebug = require('debug')('mongodb');
mongoose.set('debug', mongodbDebug);

var debug = require('debug')('TestingUtils');

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
        getLedgerSequence: sinon.stub(),
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
        setTrust: sinon.stub(),
        on: sinon.stub(),
        lastLedger: sinon.stub(),
        tx_json: { Memos: [] }
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

function getBadMongooseWallet(email_address) {
    email_address = email_address || 'joe@danger.io';
    return {
        ownerEmail: email_address,
        secret: undefined,
        address: undefined
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

function buildBankaccountSpy() {
    buildGenericSpy(BankAccount, ['create']);
}

function restoreWalletSpy() {
    restoreGenericSpy(Wallet, ['create', 'findByOwnerEmail', 'findByRippleAddress']);
}

function restoreBankaccountSpy() {
    restoreGenericSpy(BankAccount, ['create', 'findByRippleAddress']);
}

function buildNewConnectedRemoteStub() {
    sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(buildRemoteStub()));
    sinon.stub(Utils, 'getNewConnectedAdminRemote').returns(Q(buildRemoteStub()));
}

function restoreNewConnectedRemoteStub() {
    restoreGenericSpy(Utils, ['getNewConnectedRemote', 'getNewConnectedAdminRemote']);
}

function getNonAdminMongooseUser(name, email_address, bankId) {
    name = name || 'testJoe@danger.io';
    email_address = email_address || 'joe@danger.io';
    bankId = bankId || 'id_bank_ING';
    return {
        name: name,
        email: email_address,
        bank: bankId,
        role: 'user'
    };
}

function getMongooseBankAccount(bankId, bankName, wallet) {
    return {
        _id: bankId,
        name: bankName,
        info: bankName,
        hotWallet: wallet
    };
}

function buildUserFindEmailStub(user, nonAdminGeneratedUser) {
    sinon.stub(user, 'findByEmail', function (email) {
        if (email.indexOf('@example.com') > -1) {
            return Q(nonAdminGeneratedUser);
        }
        return Q();
    });
}


function buildBankaccountFindById(bankaccount, banksList) {
    sinon.stub(bankaccount, 'findById', function (bankId) {
        var index;
        for (index = 0; index < banksList.length; ++index) {
            if (banksList[index]._id === bankId)
                return Q(banksList[index]);
        }
        return Q();
    });
}

function dropMongodbDatabase() {
    debug('dropMongodbDatabase');
    // TODO: make promise work
    var deferred = Q.defer();

    var connection = mongoose.createConnection(config.mongo.uri, config.mongo.options);
    connection.on('open', function () {
        debug('connection.on(open)');
        connection.db.dropDatabase(function (err, result) {
            debug('connection.db.dropDatabase(err, result)', err, result);
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve(result);
            }
        });
    });

    // mongoose.connection.db.dropDatabase();
    // deferred.resolve({});

    return deferred.promise;
}

function buildClientSocketIoConnection() {
    // var ioSocket = io('ws://localhost:9000', {
    //     path: '/socket.io-client'
    // })
    // .then(function(){})
    // .catch(function(error){
    //     console.error(error);
    // });

    // debug('buildClientSocketIoConnection new ioSocket');

    // var socket = socketFactory({
    //     ioSocket: ioSocket
    // })
    // .then(function(){})
    // .catch(function(error){
    //     console.error(error);
    // });

    // debug('buildClientSocketIoConnection new socketFactory');
}

function buildRippleWalletGenerateForNonAdmin() {
    sinon.stub(ripple.Wallet, 'generate').returns(getNonAdminRippleGeneratedWallet());
}

function restoreRippleWalletGenerate() {
    //ripple.Wallet.generate = originalRippleWalletGenerate;
    restoreGenericSpy(ripple.Wallet, ['generate']);
}

function restoreEventEmitter() {
    //ripple.Wallet.generate = originalRippleWalletGenerate;
    restoreGenericSpy(Utils.getEventEmitter(), ['on', 'emit']);
}

function restoreAll() {
    restoreWalletSpy();
    restoreRippleWalletGenerate();
    restoreNewConnectedRemoteStub();
    restoreRippleWalletGenerate();
    restoreEventEmitter();
    restoreBankaccountSpy();
    restoreRippleWalletGenerate();
}

function createRealBankUser(bankName, iban, balance) {
    return RealBankAccount.create({
        name: bankName,
        iban: iban,
        balance: balance
    });
}

function seedBankAndUser(callback) {
    var bank = {
        name: 'ing',
        info: 'ING Bank',
        email: 'admin@ing.com',
        coldWallet: {
            address: 'r4gzWvzzJS2xLuga9bBc3XmzRMPH3VvxXg'
        },
        hotWallet: {
            address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
            secret: 'masterpassphrase'
        }
    };
    BankAccount.create(
        bank, function () {
            BankAccount.findOne(function (err, firstBank) {
                seedUsers(firstBank);
            });
        });

    function seedUsers(createdBank) {
        var iban = 'CH9300762011623852957';
        var newUser = {
            provider: 'local',
            name: 'James Bond',
            email: 'james.bond@mi6.com',
            iban: iban,
            password: '1234',
            bank: createdBank._id
        };
        User.create(newUser, function () {
            createRealBankUser(createdBank.name, iban, 100).then(function () {
                callback(newUser, bank);
            });
        });
    }
}

exports.rootAccountAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
exports.dropMongodbDatabase = dropMongodbDatabase;
exports.buildSocketSpy = buildSocketSpy;
exports.buildClientSocketIoConnection = buildClientSocketIoConnection;
exports.buildRemoteStub = buildRemoteStub;
exports.buildWalletSpy = buildWalletSpy;
exports.buildBankaccountSpy = buildBankaccountSpy;
exports.restoreWalletSpy = restoreWalletSpy;
exports.restoreBankaccountSpy = restoreBankaccountSpy;
exports.buildNewConnectedRemoteStub = buildNewConnectedRemoteStub;
exports.buildCreateForEmailStub = buildCreateForEmailStub;
exports.buildEmptyTransactionStub = buildEmptyTransactionStub;
exports.getNonAdminRippleGeneratedWallet = getNonAdminRippleGeneratedWallet;
exports.getNonAdminMongooseWallet = getNonAdminMongooseWallet;
exports.getBadMongooseWallet = getBadMongooseWallet;
exports.getAdminMongooseWallet = getAdminMongooseWallet;
exports.buildFindByOwnerEmailForAdmin = buildFindByOwnerEmailForAdmin;
exports.buildFindByOwnerEmailForUnexisting = buildFindByOwnerEmailForUnexisting;
exports.buildRippleWalletGenerateForNonAdmin = buildRippleWalletGenerateForNonAdmin;
exports.getNonAdminMongooseUser = getNonAdminMongooseUser;
exports.getMongooseBankAccount = getMongooseBankAccount;
exports.buildUserFindEmailStub = buildUserFindEmailStub;
exports.buildBankaccountFindById = buildBankaccountFindById;
exports.restoreRippleWalletGenerate = restoreRippleWalletGenerate;
exports.restoreAll = restoreAll;
exports.seedBankAndUser = seedBankAndUser;
