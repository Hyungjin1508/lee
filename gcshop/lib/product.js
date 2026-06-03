var db = require('./db');
var sanitizeHtml = require('sanitize-html');

function authIsOwner(req) {
    var name = 'Guest';
    var login = false;
    var cls = 'NON';
    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
    }
    return { name, login, cls };
}

module.exports = {
    // 상품 목록 조회
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        db.query('SELECT * FROM product', (err, products) => {
            if (err) { console.log(err); products = []; }
            var context = {
                who: name,
                login: login,
                body: 'product',
                cls: cls,
                data: products
            };
            res.render('mainFrame', context);
        });
    },

    // 상품 추가 폼
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        // 카테고리 목록을 code 테이블에서 가져옴
        db.query('SELECT * FROM code ORDER BY main_id, sub_id', (err, codes) => {
            if (err) { console.log(err); codes = []; }
            var context = {
                who: name,
                login: login,
                body: 'productCU',
                cls: cls,
                mode: 'create',
                codes: codes,
                data: { main_id: '', sub_id: '', name: '', price: '', stock: '', brand: '', supplier: '', image: '' }
            };
            res.render('mainFrame', context);
        });
    },

    // 상품 추가 처리
    create_process: (req, res) => {
        var body = req.body;
        var category = body.category ? body.category.split(',') : ['', ''];
        var image = req.file ? '/images/' + req.file.filename : '';

        db.query('INSERT INTO product (main_id, sub_id, name, price, stock, brand, supplier, image) VALUES (?,?,?,?,?,?,?,?)',
            [category[0], category[1],
             sanitizeHtml(body.name), parseInt(body.price),
             parseInt(body.stock), sanitizeHtml(body.brand),
             sanitizeHtml(body.supplier), image],
            (err) => {
                if (err) { console.log(err); }
                res.redirect('/product/view');
            });
    },

    // 상품 수정 폼
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var prodId = req.params.prodId;

        db.query('SELECT * FROM product WHERE prod_id=?', [prodId], (err, results) => {
            if (err || results.length === 0) {
                console.log(err);
                res.redirect('/product/view');
                return;
            }
            db.query('SELECT * FROM code ORDER BY main_id, sub_id', (err2, codes) => {
                if (err2) { codes = []; }
                var context = {
                    who: name,
                    login: login,
                    body: 'productCU',
                    cls: cls,
                    mode: 'update',
                    codes: codes,
                    data: results[0]
                };
                res.render('mainFrame', context);
            });
        });
    },

    // 상품 수정 처리
    update_process: (req, res) => {
        var body = req.body;
        var category = body.category ? body.category.split(',') : ['', ''];
        var image = req.file ? '/images/' + req.file.filename : body.oldImage;

        db.query('UPDATE product SET main_id=?, sub_id=?, name=?, price=?, stock=?, brand=?, supplier=?, image=? WHERE prod_id=?',
            [category[0], category[1],
             sanitizeHtml(body.name), parseInt(body.price),
             parseInt(body.stock), sanitizeHtml(body.brand),
             sanitizeHtml(body.supplier), image,
             body.prod_id],
            (err) => {
                if (err) { console.log(err); }
                res.redirect('/product/view');
            });
    },

    // 상품 삭제
    delete_process: (req, res) => {
        var prodId = req.params.prodId;
        db.query('DELETE FROM product WHERE prod_id=?', [prodId], (err) => {
            if (err) { console.log(err); }
            res.redirect('/product/view');
        });
    }
};
