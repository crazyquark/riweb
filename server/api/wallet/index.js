'use strict';

var express = require('express');
var controller = require('./wallet.controller');

var router = express.Router();

router.get('/email', controller.showByEmail);
router.get('/:id', controller.show);
router.get('/', controller.index);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
