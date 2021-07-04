const express = require('express');
const router = express.Router({mergeParams: true});
const banks = require('../controllers/banks');

router.route('/add')
    .post(banks.add)

module.exports = router;