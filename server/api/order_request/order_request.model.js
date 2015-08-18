'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var OrderRequestSchema = new Schema({
  receiverEmail: String,
  amount: Number,
  details: String
});

module.exports = mongoose.model('OrderRequest', OrderRequestSchema);