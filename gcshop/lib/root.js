var db = require('./db');

function authIsOwner(req) {
    var name = 'Guest';
    var login = false;
    var cls = 'NON';
    var loginid = '';
    if (req.session.is_logined) {
        name = req.session.name;
        login = true;
        cls = req.session.cls;
        loginid = req.session.loginid;
    }
    return { name, login, cls, loginid };
}

module.exports = {
    // 메인 페이지 - 전체 상품 목록
    home: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        db.query('SELECT * FROM product', (err, products) => {
            if (err) products = [];
            var context = {
                who: name, login: login, body: 'product', cls: cls,
                loginid: loginid,
                data: products
            };
            res.render('mainFrame', context);
        });
    },

    // 상품 상세보기
    detail: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var prodId = req.params.prodId;
        db.query('SELECT * FROM product WHERE prod_id=?', [prodId], (err, results) => {
            if (err || results.length === 0) {
                res.redirect('/');
                return;
            }
            var context = {
                who: name, login: login, body: 'productDetail', cls: cls,
                loginid: loginid,
                data: results[0]
            };
            res.render('mainFrame', context);
        });
    },

    // 검색 기능
    search: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var keyword = req.query.keyword || '';
        db.query('SELECT * FROM product WHERE name LIKE ? OR brand LIKE ?',
            ['%' + keyword + '%', '%' + keyword + '%'], (err, products) => {
                if (err) products = [];
                var context = {
                    who: name, login: login, body: 'product', cls: cls,
                    loginid: loginid,
                    data: products
                };
                res.render('mainFrame', context);
            });
    },

    // 카테고리별 조회
    category: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var mainId = req.params.mainId;
        var subId = req.params.subId;
        db.query('SELECT * FROM product WHERE main_id=? AND sub_id=?',
            [mainId, subId], (err, products) => {
                if (err) products = [];
                var context = {
                    who: name, login: login, body: 'product', cls: cls,
                    loginid: loginid,
                    data: products
                };
                res.render('mainFrame', context);
            });
    }
};
