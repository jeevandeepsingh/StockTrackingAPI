const express = require('express');
const router = express.Router({mergeParams: true});
const trades = require('../controllers/trades');
const catchAsync = require("../utils/catchAsync");
const {isValidUser, isValidData, isValidTid} = require('../middleware');

router.route('/add/:token')
    .post(isValidUser, isValidData, catchAsync(trades.add))

router.route('/details/:token')
    .get(isValidUser, catchAsync(trades.details))

router.route('/update/:token')
    .put(isValidUser, isValidData, isValidTid, catchAsync(trades.update))

router.route('/delete/:token')
    .delete(isValidUser, isValidTid, catchAsync(trades.delete))

module.exports = router;