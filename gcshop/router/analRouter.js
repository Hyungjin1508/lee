const express = require('express');
const router = express.Router();
var anal = require('../lib/anal');

// 지역별 고객 분포
router.get('/customer', (req, res) => { anal.customer(req, res); });

module.exports = router;