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
    // 게시판 종류 목록 조회
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        db.query('SELECT * FROM boardtype ORDER BY type_id', (err, results) => {
            if (err) {
                res.status(500).send('DB 에러: ' + err.message);
                return;
            }
            var context = {
                who: name, login: login, body: 'boardtype', cls: cls,
                data: results
            };
            res.render('mainFrame', context);
        });
    },

    // 게시판 종류 추가 화면
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var context = {
            who: name, login: login, body: 'boardtypeCU', cls: cls,
            mode: 'create',
            data: { type_id: '', title: '', description: '', write_YN: 'N', re_YN: 'N', numPerPage: '' }
        };
        res.render('mainFrame', context);
    },

    // 게시판 종류 추가 처리
    create_process: (req, res) => {
        var post = req.body;
        var title = sanitizeHtml(post.title);
        var description = sanitizeHtml(post.description);
        var write_YN = sanitizeHtml(post.write_YN);
        var re_YN = sanitizeHtml(post.re_YN);
        var numPerPage = parseInt(post.numPerPage) || 10;

        db.query('INSERT INTO boardtype (title, description, write_YN, re_YN, numPerPage) VALUES (?,?,?,?,?)',
            [title, description, write_YN, re_YN, numPerPage], (err) => {
                if (err) {
                    res.send('<script>alert("게시판 종류 추가 실패: ' + err.message + '"); history.back();</script>');
                    return;
                }
                res.redirect('/boardtype/view');
            });
    },

    // 게시판 종류 수정 화면
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        var type_id = req.params.typeId;
        db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err, results) => {
            if (err || results.length === 0) {
                res.redirect('/boardtype/view');
                return;
            }
            var context = {
                who: name, login: login, body: 'boardtypeCU', cls: cls,
                mode: 'update',
                data: results[0]
            };
            res.render('mainFrame', context);
        });
    },

    // 게시판 종류 수정 처리
    update_process: (req, res) => {
        var post = req.body;
        var type_id = post.type_id;
        var title = sanitizeHtml(post.title);
        var description = sanitizeHtml(post.description);
        var write_YN = sanitizeHtml(post.write_YN);
        var re_YN = sanitizeHtml(post.re_YN);
        var numPerPage = parseInt(post.numPerPage) || 10;

        db.query('UPDATE boardtype SET title=?, description=?, write_YN=?, re_YN=?, numPerPage=? WHERE type_id=?',
            [title, description, write_YN, re_YN, numPerPage, type_id], (err) => {
                if (err) {
                    res.send('<script>alert("수정 실패"); history.back();</script>');
                    return;
                }
                res.redirect('/boardtype/view');
            });
    },

    // 게시판 종류 삭제
    delete_process: (req, res) => {
        var type_id = req.params.typeId;
        // 해당 게시판 종류에 달린 글도 함께 삭제
        db.query('DELETE FROM board WHERE type_id=?', [type_id], (err) => {
            db.query('DELETE FROM boardtype WHERE type_id=?', [type_id], (err2) => {
                if (err2) {
                    res.send('<script>alert("삭제 실패"); history.back();</script>');
                    return;
                }
                res.redirect('/boardtype/view');
            });
        });
    }
};
