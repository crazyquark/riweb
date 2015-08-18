'use strict';

var _ = require('lodash');
var OrderRequest = require('./order_request.model');

// Get list of order_requests
exports.index = function(req, res) {
  OrderRequest.find(function (err, order_requests) {
    if(err) { return handleError(res, err); }
    return res.json(200, order_requests);
  });
};

// Get a single order_request
exports.show = function(req, res) {
  OrderRequest.findById(req.params.id, function (err, order_request) {
    if(err) { return handleError(res, err); }
    if(!order_request) { return res.send(404); }
    return res.json(order_request);
  });
};

// Creates a new order_request in the DB.
exports.create = function(req, res) {
  OrderRequest.create(req.body, function(err, order_request) {
    if(err) { return handleError(res, err); }
    return res.json(201, {orderRequestId: order_request._id});
  });
};

// Updates an existing order_request in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  OrderRequest.findById(req.params.id, function (err, order_request) {
    if (err) { return handleError(res, err); }
    if(!order_request) { return res.send(404); }
    var updated = _.merge(order_request, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, order_request);
    });
  });
};

// Deletes a order_request from the DB.
exports.destroy = function(req, res) {
  OrderRequest.findById(req.params.id, function (err, order_request) {
    if(err) { return handleError(res, err); }
    if(!order_request) { return res.send(404); }
    order_request.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}