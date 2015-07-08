'use strict';

var _ = require('lodash');
var ServerWalletService = require('./ServerWalletService.model');

// Get list of ServerWalletServices
exports.index = function(req, res) {
  ServerWalletService.find(function (err, ServerWalletServices) {
    if(err) { return handleError(res, err); }
    return res.json(200, ServerWalletServices);
  });
};

// Get a single ServerWalletService
exports.show = function(req, res) {
  ServerWalletService.findById(req.params.id, function (err, ServerWalletService) {
    if(err) { return handleError(res, err); }
    if(!ServerWalletService) { return res.send(404); }
    return res.json(ServerWalletService);
  });
};

// Creates a new ServerWalletService in the DB.
exports.create = function(req, res) {
  ServerWalletService.create(req.body, function(err, ServerWalletService) {
    if(err) { return handleError(res, err); }
    return res.json(201, ServerWalletService);
  });
};

// Updates an existing ServerWalletService in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  ServerWalletService.findById(req.params.id, function (err, ServerWalletService) {
    if (err) { return handleError(res, err); }
    if(!ServerWalletService) { return res.send(404); }
    var updated = _.merge(ServerWalletService, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, ServerWalletService);
    });
  });
};

// Deletes a ServerWalletService from the DB.
exports.destroy = function(req, res) {
  ServerWalletService.findById(req.params.id, function (err, ServerWalletService) {
    if(err) { return handleError(res, err); }
    if(!ServerWalletService) { return res.send(404); }
    ServerWalletService.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}