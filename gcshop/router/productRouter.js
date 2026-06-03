const express = require('express');
const router = express.Router();
var product = require('../lib/product');
const multer = require('multer');

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images');
        },
        filename: function (req, file, cb) {
            var newFileName = Buffer.from(file.originalname, "latin1").toString("utf-8");
            cb(null, newFileName);
        }
    })
});

router.get('/view', (req, res) => {
    product.view(req, res);
});

router.get('/create', (req, res) => {
    product.create(req, res);
});

router.post('/create_process', upload.single('image'), (req, res) => {
    product.create_process(req, res);
});

router.get('/update/:prodId', (req, res) => {
    product.update(req, res);
});

router.post('/update_process', upload.single('image'), (req, res) => {
    product.update_process(req, res);
});

router.get('/delete/:prodId', (req, res) => {
    product.delete_process(req, res);
});

module.exports = router;
