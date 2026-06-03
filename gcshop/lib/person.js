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
    // 회원 목록 조회
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        db.query('SELECT * FROM person', (err, persons) => {
            if (err) { console.log(err); persons = []; }
            var context = {
                who: name,
                login: login,
                body: 'person',
                cls: cls,
                data: persons
            };
            res.render('mainFrame', context);
        });
    },

    // 회원 추가 폼
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var context = {
            who: name,
            login: login,
            body: 'personCU',
            cls: cls,
            mode: 'create',
            data: { loginid: '', password: '', name: '', mf: '', address: '', tel: '', birth: '', class: 'CST' }
        };
        res.render('mainFrame', context);
    },

    // 회원 추가 처리
    create_process: (req, res) => {
        var body = req.body;
        db.query('INSERT INTO person (loginid, password, name, mf, address, tel, birth, class) VALUES (?,?,?,?,?,?,?,?)',
            [sanitizeHtml(body.loginid), sanitizeHtml(body.password),
             sanitizeHtml(body.name), sanitizeHtml(body.mf),
             sanitizeHtml(body.address), sanitizeHtml(body.tel),
             sanitizeHtml(body.birth), sanitizeHtml(body.cls)],
            (err) => {
                if (err) { console.log(err); }
                res.redirect('/person/view');
            });
    },

    // 회원 수정 폼
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var loginId = req.params.loginId;

        db.query('SELECT * FROM person WHERE loginid=?', [loginId], (err, results) => {
            if (err || results.length === 0) {
                console.log(err);
                res.redirect('/person/view');
                return;
            }
            var context = {
                who: name,
                login: login,
                body: 'personCU',
                cls: cls,
                mode: 'update',
                data: results[0]
            };
            res.render('mainFrame', context);
        });
    },

    // 회원 수정 처리
    update_process: (req, res) => {
        var body = req.body;
        db.query('UPDATE person SET password=?, name=?, mf=?, address=?, tel=?, birth=?, class=? WHERE loginid=?',
            [sanitizeHtml(body.password), sanitizeHtml(body.name),
             sanitizeHtml(body.mf), sanitizeHtml(body.address),
             sanitizeHtml(body.tel), sanitizeHtml(body.birth),
             sanitizeHtml(body.cls), sanitizeHtml(body.loginid)],
            (err) => {
                if (err) { console.log(err); }
                res.redirect('/person/view');
            });
    },

    // 회원 삭제
    delete_process: (req, res) => {
        var loginId = req.params.loginId;
        db.query('DELETE FROM person WHERE loginid=?', [loginId], (err) => {
            if (err) { console.log(err); }
            res.redirect('/person/view');
        });
    }
};
