const express = require('express');
const router = express.Router({mergeParams: true});
const users = require('../controllers/users');
const catchAsync = require("../utils/catchAsync");
const {isValidUser} = require('../middleware');

router.route('/register')
    .post(catchAsync(users.register))

router.route('/portfolio/:token')
    .get(isValidUser, catchAsync(users.portfolio))

router.route('/returns/:token')
    .get(isValidUser, catchAsync(users.returns))

router.route('/delete')
    .delete(catchAsync(users.resetData))

module.exports = router; 