'use strict';

var mongoose = require('mongoose-q')(require('mongoose'));
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
  receiverEmail: String,
  amount: Number,
  details: String
});

module.exports = mongoose.model('Order', OrderSchema);