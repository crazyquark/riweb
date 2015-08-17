'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OrderRequestSchema = new Schema({
  receiverEmail: String,
  amount: Number,
  details: String
});

module.exports = mongoose.model('OrderRequest', OrderRequestSchema);