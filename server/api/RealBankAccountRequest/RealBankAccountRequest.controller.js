'use strict';

var _ = require('lodash');
var RealBankAccountRequest = require('./RealBankAccountRequest.model');

// Get list of RealBankAccountRequests
exports.index = function(req, res) {
  RealBankAccountRequest.find(function (err, RealBankAccountRequests) {
    if(err) { return handleError(res, err); }
    return res.json(200, RealBankAccountRequests);
  });
};

// Get a single RealBankAccountRequest
exports.show = function(req, res) {
  RealBankAccountRequest.findById(req.params.id, function (err, RealBankAccountRequest) {
    if(err) { return handleError(res, err); }
    if(!RealBankAccountRequest) { return res.send(404); }
    return res.json(RealBankAccountRequest);
  });
};

// Creates a new RealBankAccountRequest in the DB.
exports.create = function(req, res) {
  RealBankAccountRequest.create(req.body, function(err, RealBankAccountRequest) {
    if(err) { return handleError(res, err); }
    return res.json(201, RealBankAccountRequest);
  });
};

// Updates an existing RealBankAccountRequest in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  RealBankAccountRequest.findById(req.params.id, function (err, RealBankAccountRequest) {
    if (err) { return handleError(res, err); }
    if(!RealBankAccountRequest) { return res.send(404); }
    var updated = _.merge(RealBankAccountRequest, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, RealBankAccountRequest);
    });
  });
};

// Deletes a RealBankAccountRequest from the DB.
exports.destroy = function(req, res) {
  RealBankAccountRequest.findById(req.params.id, function (err, RealBankAccountRequest) {
    if(err) { return handleError(res, err); }
    if(!RealBankAccountRequest) { return res.send(404); }
    RealBankAccountRequest.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}