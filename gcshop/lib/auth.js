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
    login: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var context = {
            who: name,
            login: login,
            body: 'login',
            cls: cls
        };
        res.render('mainFrame', context);
    },

    login_process: (req, res) => {
        var loginid = sanitizeHtml(req.body.loginid);
        var password = sanitizeHtml(req.body.password);

        db.query('SELECT * FROM person WHERE loginid=? AND password=?',
            [loginid, password], (err, results) => {
                if (err) { console.log(err); res.redirect('/auth/login'); return; }
                if (results.length > 0) {
                    req.session.is_logined = true;
                    req.session.name = results[0].name;
                    req.session.cls = results[0].class;
                    req.session.loginid = results[0].loginid;
                    req.session.save(() => {
                        res.redirect('/');
                    });
                } else {
                    res.redirect('/auth/login');
                }
            });
    },

    register: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var context = {
            who: name,
            login: login,
            body: 'personCU',
            cls: cls,
            mode: 'register',
            data: { loginid: '', password: '', name: '', mf: '', address: '', tel: '', birth: '', class: 'CST' }
        };
        res.render('mainFrame', context);
    },

    register_process: (req, res) => {
        var body = req.body;
        var loginid = sanitizeHtml(body.loginid);
        var password = sanitizeHtml(body.password);
        var name = sanitizeHtml(body.name);
        var mf = sanitizeHtml(body.mf);
        var address = sanitizeHtml(body.address);
        var tel = sanitizeHtml(body.tel);
        var birth = sanitizeHtml(body.birth);

        db.query('INSERT INTO person (loginid, password, name, mf, address, tel, birth, class) VALUES (?,?,?,?,?,?,?,?)',
            [loginid, password, name, mf, address, tel, birth, 'CST'],
            (err) => {
                if (err) { console.log(err); }
                res.redirect('/auth/login');
            });
    },

    logout: (req, res) => {
        req.session.destroy((err) => {
            res.redirect('/');
        });
    }
};
