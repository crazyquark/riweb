'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OrderRequestSchema = new Schema({
  payerEmail: String,
  receiverEmail: String,
  amount: Number,
  details: String
});

module.exports = mongoose.model('OrderRequest', OrderRequestSchema);