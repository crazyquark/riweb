'use strict';

var _ = require('lodash');

exports.index = function(req, res) {

};


function handleError(res, err) {
  return res.send(500, err);
}
