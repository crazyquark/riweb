var sinon = require('sinon');
var Q = require('q');
var Wallet = require('./../../server/api/wallet/wallet.model');
var BankAccount = require('./../../server/api/bankaccount/bankaccount.model');
var RealBankAccount = require('../../server/api/RealBankAccount/RealBankAccount.model');
var User = require('../../server/api/user/user.model');
var CreateAdminUserForBank = require('../../server/api/create_admin_user_for_bank/create_admin_user_for_bank.socket');
var Utils = require('./../../server/utils/utils');
var config = require('../../server/config/environment');
var ClientEventEmitter = require('../../server/utils/ClientEventEmitter/ClientEventEmitter.service');
var Bankaccount = require('./../../server/api/bankaccount/bankaccount.model');

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
        sendMax: sinon.stub(),
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

function getNewPaymentTransaction(fromAddress, toAddress, amount) {
  return {
    meta: { TransactionResult: 'tesSUCCESS' },
    tx: {
      Account: fromAddress,
      Destination: toAddress,
      Fee: 12,
      date: '123456',
      TransactionType: 'Payment',
      Amount:  { currency: 'EUR', issuer: 'ROOT', value: amount }
    }
  };
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

function buildGenericSetup() {
  var remote = buildRemoteStub();
  buildNewConnectedRemoteStub(remote);

  buildWalletSpy();
  buildRippleWalletGenerateForNonAdmin();

  //Alice and Alan are from Bank A
  //Bob is from bank B
  //John Doe has no ripple bank but only an IBAN from bank A, he wants to signup for a blockchain account.
  //alice -> alan (transfer inside the same bank)
  //alice -> bob (interbank transfer)

  var bankA = getMongooseBankAccount('_bank1', 'Bank A', getNonAdminMongooseWallet('admin@a.com', '_BANK1'));
  var bankB = getMongooseBankAccount('_bank2', 'Bank B', getNonAdminMongooseWallet('admin@b.com', '_BANK2'));
  buildBankaccountFindById(Bankaccount, [bankA, bankB]);

  var aliceWallet = getNonAdminMongooseWallet('alice@a.com', 'Alice');
  var alanWallet = getNonAdminMongooseWallet('alan@example.com', 'Alan');
  var bobWallet = getNonAdminMongooseWallet('bob@b.com', 'Bob');

  var wallets = {
    'alice@a.com': aliceWallet,
    'alan@a.com': alanWallet,
    'bob@b.com': bobWallet
  };

  sinon.stub(Wallet, 'findByOwnerEmail', buildKeyValuePromiseFunction(wallets));

  var aliceUser = getNonAdminMongooseUser('Alice', 'alice@a.com', bankA._id);
  var alanUser = getNonAdminMongooseUser('Alan', 'alan@a.com', bankA._id);
  var newUser = getNonAdminMongooseUser('John Doe', 'johndoe@a.com', bankA._id);

  var bobUser = getNonAdminMongooseUser('Bob', 'bob@b.com', bankB._id);

  var aliceAlanAndBobUsers = {
    'alice@a.com': aliceUser,
    'alan@a.com': alanUser,
    'johndoe@a.com': newUser,
    'bob@b.com': bobUser,
  };

  sinon.stub(User, 'findByEmail', buildKeyValuePromiseFunction(aliceAlanAndBobUsers));

  var data = {
    banks: {
      bankA: bankA,
      bankB: bankB
    },
    users: {
      alice: aliceUser,
      alan: alanUser,
      bob: bobUser,
      johndoe: newUser
    },
    wallets: {
      alice: aliceWallet,
      alan: alanWallet,
      bob: bobWallet
    },
    remote: remote
  };

  return data;
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
  sinon.stub(Wallet, 'findByOwnerEmail', buildKeyValuePromiseFunction({
    'admin@admin.com': {
      ownerEmail: 'admin@admin.com',
      secret: 'masterpassphrase',
      address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
    }
  }));

}

function buildCreateForEmailStub(wallet, email) {
    sinon.stub(wallet, 'create').returns(Q(getNonAdminMongooseWallet(email)));
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

function buildNewConnectedRemoteStub(remoteStub) {
  remoteStub = remoteStub || buildRemoteStub();
  sinon.stub(Utils, 'getNewConnectedRemote').returns(Q(remoteStub));
  sinon.stub(Utils, 'getNewConnectedAdminRemote').returns(Q(remoteStub));
}

function buildNewClientEventEmitterSpy(socket) {
  socket = socket || buildSocketSpy();
  var clientEventEmitter = new ClientEventEmitter(socket);
  sinon.spy(clientEventEmitter, 'emitEvent');
  sinon.spy(clientEventEmitter, 'emitSocketEvent');
  sinon.spy(clientEventEmitter, 'forwardFromEventEmitterToSocket');
  return clientEventEmitter;
}

function restoreClientEventEmitterSpy(emitter) {
  restoreGenericSpy(emitter, ['emitEvent', 'emitSocketEvent']);
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

function buildKeyValuePromiseFunction(keyValuePairs){
  return function(key){
    return Q(keyValuePairs[key]);
  }
}

function buildArrayPropertyPromiseFunction(array, propertyName){
  return function(key){
    var value = null;

    array.forEach(function(item){
      if(item[propertyName] === key){
        value = item;
      }
    });

    return Q(value);
  }
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

    return deferred.promise;
}

function buildRippleWalletGenerateForNonAdmin() {
    sinon.stub(ripple.Wallet, 'generate').returns(getNonAdminRippleGeneratedWallet());
}

function restoreRippleWalletGenerate() {
    //ripple.Wallet.generate = originalRippleWalletGenerate;
    restoreGenericSpy(ripple.Wallet, ['generate']);
}

function restoreAll() {
    restoreWalletSpy();
    restoreRippleWalletGenerate();
    restoreNewConnectedRemoteStub();
    restoreRippleWalletGenerate();
    restoreBankaccountSpy();
    restoreRippleWalletGenerate();
    restoreGenericSpy(User, ['findByEmail']);
    restoreGenericSpy(Bankaccount, ['findById']);
}

function createRealBankUser(bankName, iban, balance) {
    return RealBankAccount.create({
        name: bankName,
        iban: iban,
        balance: balance
    });
}

function seedBankAndUser(emitter, callback) {
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
                seedAdminBankUser(createdBank).then(function() {
                    callback(newUser, bank);
                });
            });
        });
    }

    function seedAdminBankUser(createdBank) {
        var adminUserInfo = {
            info: createdBank.info + ' Admin',
            email: createdBank.email,
            bankId: createdBank._id,
            password: createdBank.email,
        };
        return CreateAdminUserForBank.createAdminUserForBank(adminUserInfo, emitter);
    }
}

exports.rootAccountAddress = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh';
exports.dropMongodbDatabase = dropMongodbDatabase;
exports.buildSocketSpy = buildSocketSpy;
exports.buildRemoteStub = buildRemoteStub;
exports.buildWalletSpy = buildWalletSpy;
exports.buildBankaccountSpy = buildBankaccountSpy;
exports.restoreWalletSpy = restoreWalletSpy;
exports.restoreBankaccountSpy = restoreBankaccountSpy;
exports.buildNewConnectedRemoteStub = buildNewConnectedRemoteStub;
exports.buildNewClientEventEmitterSpy= buildNewClientEventEmitterSpy;
exports.buildCreateForEmailStub = buildCreateForEmailStub;
exports.buildEmptyTransactionStub = buildEmptyTransactionStub;
exports.getNonAdminRippleGeneratedWallet = getNonAdminRippleGeneratedWallet;
exports.getNonAdminMongooseWallet = getNonAdminMongooseWallet;
exports.getNewPaymentTransaction = getNewPaymentTransaction;
exports.getBadMongooseWallet = getBadMongooseWallet;
exports.getAdminMongooseWallet = getAdminMongooseWallet;
exports.buildFindByOwnerEmailForAdmin = buildFindByOwnerEmailForAdmin;
exports.buildFindByOwnerEmailForUnexisting = buildFindByOwnerEmailForUnexisting;
exports.buildRippleWalletGenerateForNonAdmin = buildRippleWalletGenerateForNonAdmin;
exports.getNonAdminMongooseUser = getNonAdminMongooseUser;
exports.getMongooseBankAccount = getMongooseBankAccount;
exports.buildBankaccountFindById = buildBankaccountFindById;
exports.buildKeyValuePromiseFunction = buildKeyValuePromiseFunction;
exports.buildArrayPropertyPromiseFunction = buildArrayPropertyPromiseFunction;
exports.restoreRippleWalletGenerate = restoreRippleWalletGenerate;
exports.restoreAll = restoreAll;
exports.restoreClientEventEmitterSpy = restoreClientEventEmitterSpy;
exports.buildGenericSetup = buildGenericSetup;
exports.seedBankAndUser = seedBankAndUser;
