'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  orderRequestId: String,
  senderEmail: String,
  receiverEmail: String,
  amount: Number,
  details: String,
  status: String,
  timestamp: { type : Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);