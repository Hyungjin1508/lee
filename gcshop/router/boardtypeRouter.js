const express = require('express');
const router = express.Router();
var boardtype = require('../lib/boardtype');

router.get('/view', (req, res) => { boardtype.view(req, res); });
router.get('/create', (req, res) => { boardtype.create(req, res); });
router.post('/create_process', (req, res) => { boardtype.create_process(req, res); });
router.get('/update/:typeId', (req, res) => { boardtype.update(req, res); });
router.post('/update_process', (req, res) => { boardtype.update_process(req, res); });
router.get('/delete/:typeId', (req, res) => { boardtype.delete_process(req, res); });

module.exports = router;
