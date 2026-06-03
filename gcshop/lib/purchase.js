var db = require('./db');
var sanitizeHtml = require('sanitize-html');

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

// 현재 날짜·시간 문자열 생성
function getNow() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    var h = now.getHours();
    var min = String(now.getMinutes()).padStart(2, '0');
    var sec = String(now.getSeconds()).padStart(2, '0');
    return y + '.' + m + '.' + d + ' : ' + h + '시 ' + min + '분 ' + sec + '초';
}

module.exports = {

    // ========================================
    // 고객용: 구매 목록 (Purchase List)
    // ========================================
    purchase: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login) { res.redirect('/'); return; }

        db.query(
            `SELECT pu.*, pr.name as prod_name, pr.image
             FROM purchase pu
             LEFT JOIN product pr ON pu.prod_id = pr.prod_id
             WHERE pu.loginid = ?
             ORDER BY pu.purchase_id DESC`,
            [loginid], (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'purchase', cls: cls,
                    loginid: loginid,
                    data: results
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 고객용: 구매 상세 (수량 입력 화면)
    // ========================================
    purchasedetail: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login || cls !== 'CST') { res.redirect('/'); return; }

        var prodId = req.params.prodId;
        db.query('SELECT * FROM product WHERE prod_id=?', [prodId], (err, results) => {
            if (err || results.length === 0) { res.redirect('/'); return; }
            var context = {
                who: name, login: login, body: 'purchaseDetail', cls: cls,
                loginid: loginid,
                data: results[0]
            };
            res.render('mainFrame', context);
        });
    },

    // ========================================
    // 고객용: 결재 처리 (purchaseDetail → purchase 테이블에 INSERT)
    // ========================================
    purchase_process: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login) { res.redirect('/'); return; }

        var post = req.body;
        var prod_id = post.prod_id;
        var qty = parseInt(post.qty) || 1;

        db.query('SELECT * FROM product WHERE prod_id=?', [prod_id], (err, results) => {
            if (err || results.length === 0) { res.redirect('/'); return; }

            var product = results[0];
            var price = product.price;
            var point = Math.floor(price * 0.005);  // 가격의 0.5%
            var total = price * qty;
            var date = getNow();

            db.query(
                `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel)
                 VALUES (?,?,?,?,?,?,?,'Y','N')`,
                [loginid, prod_id, date, price, point, qty, total],
                (err2) => {
                    if (err2) {
                        res.send('<script>alert("구매 실패"); history.back();</script>');
                        return;
                    }
                    res.redirect('/purchase');
                });
        });
    },

    // ========================================
    // 고객용: 구매 취소
    // ========================================
    cancel: (req, res) => {
        var { loginid } = authIsOwner(req);
        var purchaseId = req.params.purchaseId;
        db.query('UPDATE purchase SET cancel="Y" WHERE purchase_id=? AND loginid=?',
            [purchaseId, loginid], (err) => {
                res.redirect('/purchase');
            });
    },

    // ========================================
    // 고객용: 장바구니 보기
    // ========================================
    cart: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login) { res.redirect('/'); return; }

        db.query(
            `SELECT c.*, p.name as prod_name, p.image, p.price
             FROM cart c
             LEFT JOIN product p ON c.prod_id = p.prod_id
             WHERE c.loginid = ?
             ORDER BY c.cart_id DESC`,
            [loginid], (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'cart', cls: cls,
                    loginid: loginid,
                    data: results
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 고객용: 장바구니에 담기
    // ========================================
    addcart: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login) { res.redirect('/'); return; }

        var prod_id = req.body.prod_id;
        var date = getNow();

        // 이미 장바구니에 있는지 체크
        db.query('SELECT * FROM cart WHERE loginid=? AND prod_id=?',
            [loginid, prod_id], (err, results) => {
                if (results && results.length > 0) {
                    // 이미 장바구니에 있음
                    res.send('<script>alert("장바구니에 이미 있는 제품입니다."); location.href="/purchase/cart";</script>');
                    return;
                }
                db.query('INSERT INTO cart (loginid, prod_id, date) VALUES (?,?,?)',
                    [loginid, prod_id, date], (err2) => {
                        if (err2) {
                            res.send('<script>alert("장바구니 추가 실패"); history.back();</script>');
                            return;
                        }
                        res.redirect('/purchase/cart');
                    });
            });
    },

    // ========================================
    // 고객용: 장바구니에서 결재 (체크박스 선택 항목)
    // ========================================
    cartpurchase_process: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (!login) { res.redirect('/'); return; }

        var post = req.body;
        var numOfCheck = parseInt(post.numOfCheck) || 0;

        if (numOfCheck === 0) {
            res.send('<script>alert("구매할 상품을 선택해 주세요"); history.back();</script>');
            return;
        }

        // check 값은 cart_id 배열
        var checks = post.check;
        var qtys = post.qty;

        // 단일 체크일 때 배열 변환
        if (!Array.isArray(checks)) checks = [checks];
        if (!Array.isArray(qtys)) qtys = [qtys];

        var date = getNow();
        var processed = 0;
        var total_items = checks.length;

        // 체크된 cart 항목들을 각각 구매 처리
        // check 값은 cart_id, 해당하는 qty를 찾아야 함
        // cart.ejs에서 check value = cart_id, qty는 같은 행에 있으므로 인덱스 매핑 필요

        // 모든 cart 데이터를 먼저 가져와서 매핑
        db.query(
            `SELECT c.*, p.price FROM cart c LEFT JOIN product p ON c.prod_id = p.prod_id WHERE c.loginid=? ORDER BY c.cart_id DESC`,
            [loginid], (err, allCarts) => {
                if (err) { res.redirect('/purchase/cart'); return; }

                // cart_id별 인덱스 매핑 (allCarts 순서 = qty 순서)
                checks.forEach((cart_id, idx) => {
                    var cartItem = allCarts.find(c => c.cart_id == cart_id);
                    if (!cartItem) {
                        processed++;
                        if (processed === total_items) res.redirect('/purchase');
                        return;
                    }

                    // 해당 cart의 qty 찾기: allCarts에서 cart_id의 인덱스 위치에 해당하는 qty
                    var cartIndex = allCarts.findIndex(c => c.cart_id == cart_id);
                    var qty = parseInt(qtys[cartIndex]) || 1;
                    var price = cartItem.price;
                    var point = Math.floor(price * 0.005);
                    var total = price * qty;

                    // purchase 테이블에 INSERT
                    db.query(
                        `INSERT INTO purchase (loginid, prod_id, date, price, point, qty, total, payYN, cancel)
                         VALUES (?,?,?,?,?,?,?,'Y','N')`,
                        [loginid, cartItem.prod_id, date, price, point, qty, total],
                        (err2) => {
                            // cart에서 삭제
                            db.query('DELETE FROM cart WHERE cart_id=?', [cart_id], (err3) => {
                                processed++;
                                if (processed === total_items) {
                                    res.redirect('/purchase');
                                }
                            });
                        });
                });
            });
    },

    // ========================================
    // 고객용: 장바구니에서 삭제 (체크박스 선택 항목)
    // ========================================
    cartdelete_process: (req, res) => {
        var { loginid } = authIsOwner(req);
        var post = req.body;
        var numOfCheck = parseInt(post.numOfCheck) || 0;

        if (numOfCheck === 0) {
            res.send('<script>alert("삭제할 상품을 선택해 주세요"); history.back();</script>');
            return;
        }

        var checks = post.check;
        if (!Array.isArray(checks)) checks = [checks];

        var processed = 0;
        checks.forEach((cart_id) => {
            db.query('DELETE FROM cart WHERE cart_id=? AND loginid=?', [cart_id, loginid], (err) => {
                processed++;
                if (processed === checks.length) {
                    res.redirect('/purchase/cart');
                }
            });
        });
    },

    // ========================================
    // 관리자용: purchase 테이블 조회
    // ========================================
    purchaseview: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        db.query(
            `SELECT pu.*, pr.name as prod_name, pe.name as cust_name
             FROM purchase pu
             LEFT JOIN product pr ON pu.prod_id = pr.prod_id
             LEFT JOIN person pe ON pu.loginid = pe.loginid
             ORDER BY pu.purchase_id DESC`,
            (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'purchaseView', cls: cls,
                    data: results
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 관리자용: purchase 수정 화면
    // ========================================
    purchaseupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var purchaseId = req.params.purchaseId;
        db.query('SELECT * FROM purchase WHERE purchase_id=?', [purchaseId], (err, results) => {
            if (err || results.length === 0) { res.redirect('/purchase/purchaseview'); return; }
            var purchaseData = results[0];

            // person, product 목록도 가져오기
            db.query('SELECT loginid, name FROM person', (err2, persons) => {
                db.query('SELECT prod_id, name FROM product', (err3, products) => {
                    var context = {
                        who: name, login: login, body: 'purchaseU', cls: cls,
                        data: purchaseData,
                        persons: persons || [],
                        products: products || []
                    };
                    res.render('mainFrame', context);
                });
            });
        });
    },

    // ========================================
    // 관리자용: purchase 수정 처리
    // ========================================
    purchaseupdate_process: (req, res) => {
        var post = req.body;
        var purchase_id = post.purchase_id;
        var loginid = sanitizeHtml(post.loginid);
        var prod_id = post.prod_id;
        var date = post.date;
        var price = parseInt(post.price) || 0;
        var point = parseInt(post.point) || 0;
        var qty = parseInt(post.qty) || 1;
        var total = parseInt(post.total) || 0;
        var payYN = sanitizeHtml(post.payYN);
        var cancel = sanitizeHtml(post.cancel);
        var refund = sanitizeHtml(post.refund) || 'N';

        db.query(
            `UPDATE purchase SET loginid=?, prod_id=?, date=?, price=?, point=?, qty=?, total=?, payYN=?, cancel=?
             WHERE purchase_id=?`,
            [loginid, prod_id, date, price, point, qty, total, payYN, cancel, purchase_id],
            (err) => {
                if (err) {
                    res.send('<script>alert("수정 실패"); history.back();</script>');
                    return;
                }
                res.redirect('/purchase/purchaseview');
            });
    },

    // ========================================
    // 관리자용: purchase 삭제
    // ========================================
    purchasedelete: (req, res) => {
        var purchaseId = req.params.purchaseId;
        db.query('DELETE FROM purchase WHERE purchase_id=?', [purchaseId], (err) => {
            res.redirect('/purchase/purchaseview');
        });
    },

    // ========================================
    // 관리자용: cart 테이블 조회
    // ========================================
    cartview: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        db.query(
            `SELECT c.*, p.name as prod_name, pe.name as cust_name
             FROM cart c
             LEFT JOIN product p ON c.prod_id = p.prod_id
             LEFT JOIN person pe ON c.loginid = pe.loginid
             ORDER BY c.cart_id DESC`,
            (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'cartView', cls: cls,
                    data: results
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 관리자용: cart 수정 화면
    // ========================================
    cartupdate: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var cartId = req.params.cartId;
        db.query('SELECT * FROM cart WHERE cart_id=?', [cartId], (err, results) => {
            if (err || results.length === 0) { res.redirect('/purchase/cartview'); return; }
            var cartData = results[0];

            db.query('SELECT loginid, name FROM person', (err2, persons) => {
                db.query('SELECT prod_id, name FROM product', (err3, products) => {
                    var context = {
                        who: name, login: login, body: 'cartU', cls: cls,
                        data: cartData,
                        persons: persons || [],
                        products: products || []
                    };
                    res.render('mainFrame', context);
                });
            });
        });
    },

    // ========================================
    // 관리자용: cart 수정 처리
    // ========================================
    cartupdate_process: (req, res) => {
        var post = req.body;
        var cart_id = post.cart_id;
        var loginid = sanitizeHtml(post.loginid);
        var prod_id = post.prod_id;

        db.query('UPDATE cart SET loginid=?, prod_id=? WHERE cart_id=?',
            [loginid, prod_id, cart_id], (err) => {
                if (err) {
                    res.send('<script>alert("수정 실패"); history.back();</script>');
                    return;
                }
                res.redirect('/purchase/cartview');
            });
    },

    // ========================================
    // 관리자용: cart 삭제
    // ========================================
    cartdelete: (req, res) => {
        var cartId = req.params.cartId;
        db.query('DELETE FROM cart WHERE cart_id=?', [cartId], (err) => {
            res.redirect('/purchase/cartview');
        });
    }
};
