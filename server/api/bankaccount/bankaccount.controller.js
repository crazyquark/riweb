'use strict';

var _ = require('lodash');
var Bankaccount = require('./bankaccount.model');

// Get list of bankaccounts
exports.index = function(req, res) {
  Bankaccount.find(function (err, bankaccounts) {
    if(err) { return handleError(res, err); }
    return res.json(200, bankaccounts);
  });
};

// Get a single bankaccount
exports.show = function(req, res) {
  Bankaccount.findById(req.params.id, function (err, bankaccount) {
    if(err) { return handleError(res, err); }
    if(!bankaccount) { return res.send(404); }
    return res.json(bankaccount);
  });
};

// Creates a new bankaccount in the DB.
exports.create = function(req, res) {
  Bankaccount.create(req.body, function(err, bankaccount) {
    if(err) { return handleError(res, err); }
    return res.json(201, bankaccount);
  });
};

// Updates an existing bankaccount in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Bankaccount.findById(req.params.id, function (err, bankaccount) {
    if (err) { return handleError(res, err); }
    if(!bankaccount) { return res.send(404); }
    var updated = _.merge(bankaccount, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, bankaccount);
    });
  });
};

// Deletes a bankaccount from the DB.
exports.destroy = function(req, res) {
  Bankaccount.findById(req.params.id, function (err, bankaccount) {
    if(err) { return handleError(res, err); }
    if(!bankaccount) { return res.send(404); }
    bankaccount.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
