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
    // 게시판 글 목록
    // URL: /board/view/:numPerPage/:typeId
    // 정렬: 원글(p_id IS NULL)의 board_id를 기준으로 DESC,
    //       답글은 원글 바로 아래에 ASC
    // ========================================
    view: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var type_id = req.params.typeId;
        var numPerPage = req.params.numPerPage;

        db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err, typeResults) => {
            if (err || typeResults.length === 0) { res.redirect('/'); return; }
            var boardtype = typeResults[0];

            // 원글 + 답글 함께 가져오기
            // p_id가 NULL이면 원글, 있으면 답글
            // IFNULL(p_id, board_id)로 그룹핑하고, p_id DESC, board_id ASC 정렬
            db.query(
                `SELECT b.*, p.name as writer_name
                 FROM board b
                 LEFT JOIN person p ON b.loginid = p.loginid
                 WHERE b.type_id = ?
                 ORDER BY IFNULL(b.p_id, b.board_id) DESC, b.board_id ASC`,
                [type_id], (err2, boards) => {
                    if (err2) boards = [];
                    var context = {
                        who: name, login: login, body: 'board', cls: cls,
                        loginid: loginid,
                        boardtype: boardtype,
                        data: boards
                    };
                    res.render('mainFrame', context);
                });
        });
    },

    // ========================================
    // 글쓰기 화면
    // ========================================
    create: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var type_id = req.params.typeId;

        db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err, typeResults) => {
            if (err || typeResults.length === 0) { res.redirect('/'); return; }
            var boardtype = typeResults[0];

            var context = {
                who: name, login: login, body: 'boardCRU', cls: cls,
                loginid: loginid,
                mode: 'create',
                boardtype: boardtype,
                data: { board_id: '', type_id: type_id, p_id: '', loginid: loginid, password: '', title: '', date: '', content: '' }
            };
            res.render('mainFrame', context);
        });
    },

    // ========================================
    // 글쓰기 처리
    // ========================================
    create_process: (req, res) => {
        var { loginid } = authIsOwner(req);
        var post = req.body;
        var type_id = sanitizeHtml(post.type_id);
        var lid = sanitizeHtml(post.loginid) || loginid;
        var title = sanitizeHtml(post.title);
        var content = post.content;
        var password = sanitizeHtml(post.password);
        var date = getNow();

        db.query('INSERT INTO board (type_id, loginid, password, title, date, content) VALUES (?,?,?,?,?,?)',
            [type_id, lid, password, title, date, content], (err) => {
                if (err) {
                    res.send('<script>alert("글쓰기 실패: ' + err.message + '"); history.back();</script>');
                    return;
                }
                // numPerPage 가져오기
                db.query('SELECT numPerPage FROM boardtype WHERE type_id=?', [type_id], (err2, bt) => {
                    var npp = (bt && bt.length > 0) ? bt[0].numPerPage : 10;
                    res.redirect('/board/view/' + npp + '/' + type_id);
                });
            });
    },

    // ========================================
    // 글 상세보기
    // URL: /board/detail/:boardId/:typeId/:re_YN
    // ========================================
    detail: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var board_id = req.params.boardId;
        var type_id = req.params.typeId;
        var re_YN = req.params.re_YN;

        db.query(
            `SELECT b.*, p.name as writer_name
             FROM board b LEFT JOIN person p ON b.loginid = p.loginid
             WHERE b.board_id=?`,
            [board_id], (err, results) => {
                if (err || results.length === 0) { res.redirect('/'); return; }
                var boardData = results[0];

                db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err2, typeResults) => {
                    if (err2 || typeResults.length === 0) { res.redirect('/'); return; }
                    var boardtype = typeResults[0];

                    // 이 글에 대한 답변이 이미 있는지 확인
                    db.query('SELECT COUNT(*) as cnt FROM board WHERE p_id=?', [board_id], (err3, cntResult) => {
                        var hasAnswer = (cntResult && cntResult[0].cnt > 0);

                        var context = {
                            who: name, login: login, body: 'boardCRU', cls: cls,
                            loginid: loginid,
                            mode: 'read',
                            boardtype: boardtype,
                            re_YN: re_YN,
                            data: boardData,
                            hasAnswer: hasAnswer
                        };
                        res.render('mainFrame', context);
                    });
                });
            });
    },

    // ========================================
    // 글 수정 화면
    // ========================================
    update: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        var board_id = req.params.boardId;
        var type_id = req.params.typeId;

        db.query(
            `SELECT b.*, p.name as writer_name
             FROM board b LEFT JOIN person p ON b.loginid = p.loginid
             WHERE b.board_id=?`,
            [board_id], (err, results) => {
                if (err || results.length === 0) { res.redirect('/'); return; }
                var boardData = results[0];

                db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err2, typeResults) => {
                    if (err2 || typeResults.length === 0) { res.redirect('/'); return; }
                    var boardtype = typeResults[0];
                    var context = {
                        who: name, login: login, body: 'boardCRU', cls: cls,
                        loginid: loginid,
                        mode: 'update',
                        boardtype: boardtype,
                        re_YN: 'N',
                        data: boardData,
                        hasAnswer: false
                    };
                    res.render('mainFrame', context);
                });
            });
    },

    // ========================================
    // 글 수정 처리
    // ========================================
    update_process: (req, res) => {
        var post = req.body;
        var board_id = post.board_id;
        var type_id = post.type_id;
        var title = sanitizeHtml(post.title);
        var content = post.content;
        var password = sanitizeHtml(post.password);

        db.query('SELECT * FROM board WHERE board_id=?', [board_id], (err, results) => {
            if (err || results.length === 0) {
                res.send('<script>alert("글을 찾을 수 없습니다."); history.back();</script>');
                return;
            }
            if (results[0].password && results[0].password !== password) {
                res.send('<script>alert("비밀번호가 일치하지 않습니다."); history.back();</script>');
                return;
            }
            db.query('UPDATE board SET title=?, content=?, password=? WHERE board_id=?',
                [title, content, password, board_id], (err2) => {
                    if (err2) {
                        res.send('<script>alert("수정 실패"); history.back();</script>');
                        return;
                    }
                    db.query('SELECT numPerPage FROM boardtype WHERE type_id=?', [type_id], (err3, bt) => {
                        var npp = (bt && bt.length > 0) ? bt[0].numPerPage : 10;
                        res.redirect('/board/view/' + npp + '/' + type_id);
                    });
                });
        });
    },

    // ========================================
    // 글 삭제
    // ========================================
    delete_process: (req, res) => {
        var board_id = req.params.boardId;
        var type_id = req.params.typeId;

        // 답글도 함께 삭제
        db.query('DELETE FROM board WHERE p_id=?', [board_id], (err) => {
            db.query('DELETE FROM board WHERE board_id=?', [board_id], (err2) => {
                db.query('SELECT numPerPage FROM boardtype WHERE type_id=?', [type_id], (err3, bt) => {
                    var npp = (bt && bt.length > 0) ? bt[0].numPerPage : 10;
                    res.redirect('/board/view/' + npp + '/' + type_id);
                });
            });
        });
    },

    // ========================================
    // 답글 작성 화면 (관리자만)
    // URL: /board/answer/:boardId/:typeId
    // ========================================
    answer: (req, res) => {
        var { name, login, cls, loginid } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var board_id = req.params.boardId;
        var type_id = req.params.typeId;

        db.query(
            `SELECT b.*, p.name as writer_name
             FROM board b LEFT JOIN person p ON b.loginid = p.loginid
             WHERE b.board_id=?`,
            [board_id], (err, results) => {
                if (err || results.length === 0) { res.redirect('/'); return; }
                var parentPost = results[0];

                db.query('SELECT * FROM boardtype WHERE type_id=?', [type_id], (err2, typeResults) => {
                    var boardtype = (typeResults && typeResults.length > 0) ? typeResults[0] : {};
                    var context = {
                        who: name, login: login, body: 'boardAnswer', cls: cls,
                        loginid: loginid,
                        boardtype: boardtype,
                        parentPost: parentPost
                    };
                    res.render('mainFrame', context);
                });
            });
    },

    // ========================================
    // 답글 작성 처리
    // ========================================
    answer_process: (req, res) => {
        var { loginid } = authIsOwner(req);
        var post = req.body;
        var type_id = post.type_id;
        var p_id = post.p_id;       // 원글 board_id
        var title = '[답변] : ' + sanitizeHtml(post.parent_title);
        var content = post.content;
        var date = getNow();

        db.query(
            'INSERT INTO board (type_id, p_id, loginid, title, date, content) VALUES (?,?,?,?,?,?)',
            [type_id, p_id, loginid, title, date, content], (err) => {
                if (err) {
                    res.send('<script>alert("답변 실패"); history.back();</script>');
                    return;
                }
                db.query('SELECT numPerPage FROM boardtype WHERE type_id=?', [type_id], (err2, bt) => {
                    var npp = (bt && bt.length > 0) ? bt[0].numPerPage : 10;
                    res.redirect('/board/view/' + npp + '/' + type_id);
                });
            });
    }
};
