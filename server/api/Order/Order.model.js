'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  senderEmail: String,
  receiverEmail: String,
  amount: Number,
  details: String,
  status: String,
});

module.exports = mongoose.model('Order', OrderSchema);