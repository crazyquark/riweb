'use strict';

var _ = require('lodash');
var RealBankAccount = require('./RealBankAccount.model');

// Get list of RealBankAccounts
exports.index = function(req, res) {
  RealBankAccount.find(function (err, RealBankAccounts) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(RealBankAccounts);
  });
};

// Get a single RealBankAccount
exports.show = function(req, res) {
  RealBankAccount.findById(req.params.id, function (err, RealBankAccount) {
    if(err) { return handleError(res, err); }
    if(!RealBankAccount) { return res.status(404).send('Not Found'); }
    return res.json(RealBankAccount);
  });
};

// Creates a new RealBankAccount in the DB.
exports.create = function(req, res) {
  RealBankAccount.create(req.body, function(err, RealBankAccount) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(RealBankAccount);
  });
};

// Updates an existing RealBankAccount in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  RealBankAccount.findById(req.params.id, function (err, RealBankAccount) {
    if (err) { return handleError(res, err); }
    if(!RealBankAccount) { return res.status(404).send('Not Found'); }
    var updated = _.merge(RealBankAccount, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(RealBankAccount);
    });
  });
};

// Deletes a RealBankAccount from the DB.
exports.destroy = function(req, res) {
  RealBankAccount.findById(req.params.id, function (err, RealBankAccount) {
    if(err) { return handleError(res, err); }
    if(!RealBankAccount) { return res.status(404).send('Not Found'); }
    RealBankAccount.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}