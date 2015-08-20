'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var OrderRequestSchema = new Schema({
  receiverEmail: String,
  amount: Number,
  returnUrl: String,
  cancelUrl: String,
  timestamp: { type : Date, default: Date.now },
  details: String
});

module.exports = mongoose.model('OrderRequest', OrderRequestSchema);