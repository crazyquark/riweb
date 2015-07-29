'use strict';

var _ = require('lodash');
var CreateBank = require('./create_bank.model');

// Get list of create_banks
exports.index = function(req, res) {
  CreateBank.find(function (err, create_banks) {
    if(err) { return handleError(res, err); }
    return res.json(200, create_banks);
  });
};

// Get a single create_bank
exports.show = function(req, res) {
  CreateBank.findById(req.params.id, function (err, create_bank) {
    if(err) { return handleError(res, err); }
    if(!create_bank) { return res.send(404); }
    return res.json(create_bank);
  });
};

// Creates a new create_bank in the DB.
exports.create = function(req, res) {
  CreateBank.create(req.body, function(err, create_bank) {
    if(err) { return handleError(res, err); }
    return res.json(201, create_bank);
  });
};

// Updates an existing create_bank in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  CreateBank.findById(req.params.id, function (err, create_bank) {
    if (err) { return handleError(res, err); }
    if(!create_bank) { return res.send(404); }
    var updated = _.merge(create_bank, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, create_bank);
    });
  });
};

// Deletes a create_bank from the DB.
exports.destroy = function(req, res) {
  CreateBank.findById(req.params.id, function (err, create_bank) {
    if(err) { return handleError(res, err); }
    if(!create_bank) { return res.send(404); }
    create_bank.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}