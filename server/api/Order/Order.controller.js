'use strict';

var _ = require('lodash');
var Order = require('./Order.model');

// Get list of Orders
exports.index = function(req, res) {
  Order.find(function (err, Orders) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(Orders);
  });
};

// Get a single Order
exports.show = function(req, res) {
  Order.findById(req.params.id, function (err, Order) {
    if(err) { return handleError(res, err); }
    if(!Order) { return res.send(404); }
    return res.json(Order);
  });
};

// Creates a new Order in the DB.
exports.create = function(req, res) {
  Order.create(req.body, function(err, Order) {
    if(err) { return handleError(res, err); }
    return res.json(201, Order);
  });
};

// Updates an existing Order in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Order.findById(req.params.id, function (err, Order) {
    if (err) { return handleError(res, err); }
    if(!Order) { return res.send(404); }
    var updated = _.merge(Order, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, Order);
    });
  });
};

// Deletes a Order from the DB.
exports.destroy = function(req, res) {
  Order.findById(req.params.id, function (err, Order) {
    if(err) { return handleError(res, err); }
    if(!Order) { return res.send(404); }
    Order.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
