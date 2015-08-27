/**
 * Utililty functions for make_transfer
 */

'use strict';

var OrderRequests = require('../order_request/order_request.model');
var Order = require('../Order/Order.model');
var debug = require('debug')('MakeTransfer');

function saveOrderToDB(orderInfo) {
    OrderRequests.findOneQ({ _id: orderInfo.orderRequestId }).then(function (orderRequest) {
        debug('found order request: ', orderRequest);
        Order.createQ(orderInfo).then(function (savedOrder) {
            debug('Saved order: ', savedOrder);
        }, function (err) {
            debug('error', err);
        });
    }, function () {
        debug('failed to find order request with ID: ', orderInfo.orderRequestId);
    });
}

exports.saveOrderToDB = saveOrderToDB;