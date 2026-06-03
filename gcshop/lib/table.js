var db = require('./db');

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

    // ========================================
    // 테이블 목록 (INFORMATION_SCHEMA.TABLES)
    // ========================================
    list: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        db.query(
            `SELECT TABLE_NAME, TABLE_COMMENT
             FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = 'webdb2026'
             ORDER BY TABLE_NAME`,
            (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'tableManage', cls: cls,
                    data: results
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 특정 테이블 데이터 조회 (컬럼 comment를 헤더로)
    // ========================================
    view: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var tableName = req.params.tableName;

        // 1) 컬럼 정보 가져오기 (COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY)
        db.query(
            `SELECT COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName], (err, columns) => {
                if (err) { res.redirect('/table'); return; }

                // PK 컬럼 찾기
                var pkColumn = null;
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].COLUMN_KEY === 'PRI') {
                        pkColumn = columns[i].COLUMN_NAME;
                        break;
                    }
                }

                // 2) 테이블 데이터 가져오기
                db.query(`SELECT * FROM \`${tableName}\``, (err2, rows) => {
                    if (err2) rows = [];

                    var context = {
                        who: name, login: login, body: 'tableView', cls: cls,
                        tableName: tableName,
                        columns: columns,
                        pkColumn: pkColumn,
                        data: rows
                    };
                    res.render('mainFrame', context);
                });
            });
    },

    // ========================================
    // 생성 화면 (컬럼 정보 기반으로 입력 폼 동적 생성)
    // ========================================
    create: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var tableName = req.params.tableName;

        db.query(
            `SELECT COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY, EXTRA, DATA_TYPE, IS_NULLABLE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName], (err, columns) => {
                if (err) { res.redirect('/table/view/' + tableName); return; }

                var context = {
                    who: name, login: login, body: 'tableCU', cls: cls,
                    mode: 'create',
                    tableName: tableName,
                    columns: columns,
                    data: {}
                };
                res.render('mainFrame', context);
            });
    },

    // ========================================
    // 생성 처리
    // ========================================
    create_process: (req, res) => {
        var tableName = req.params.tableName;
        var post = req.body;

        // auto_increment 컬럼 제외하고 INSERT
        db.query(
            `SELECT COLUMN_NAME, EXTRA
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName], (err, columns) => {
                if (err) { res.redirect('/table/view/' + tableName); return; }

                var cols = [];
                var vals = [];
                var placeholders = [];
                columns.forEach(col => {
                    if (col.EXTRA !== 'auto_increment' && post[col.COLUMN_NAME] !== undefined) {
                        cols.push('`' + col.COLUMN_NAME + '`');
                        vals.push(post[col.COLUMN_NAME]);
                        placeholders.push('?');
                    }
                });

                var sql = `INSERT INTO \`${tableName}\` (${cols.join(',')}) VALUES (${placeholders.join(',')})`;
                db.query(sql, vals, (err2) => {
                    if (err2) {
                        res.send('<script>alert("생성 실패: ' + err2.message.replace(/'/g, "\\'") + '"); history.back();</script>');
                        return;
                    }
                    res.redirect('/table/view/' + tableName);
                });
            });
    },

    // ========================================
    // 수정 화면
    // ========================================
    update: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        if (cls !== 'MNG') { res.redirect('/'); return; }

        var tableName = req.params.tableName;
        var pkValue = req.params.pkValue;

        db.query(
            `SELECT COLUMN_NAME, COLUMN_COMMENT, COLUMN_KEY, EXTRA, DATA_TYPE, IS_NULLABLE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName], (err, columns) => {
                if (err) { res.redirect('/table/view/' + tableName); return; }

                // PK 컬럼 찾기
                var pkColumn = null;
                for (var i = 0; i < columns.length; i++) {
                    if (columns[i].COLUMN_KEY === 'PRI') {
                        pkColumn = columns[i].COLUMN_NAME;
                        break;
                    }
                }

                db.query(`SELECT * FROM \`${tableName}\` WHERE \`${pkColumn}\` = ?`, [pkValue], (err2, results) => {
                    if (err2 || results.length === 0) { res.redirect('/table/view/' + tableName); return; }

                    var context = {
                        who: name, login: login, body: 'tableCU', cls: cls,
                        mode: 'update',
                        tableName: tableName,
                        columns: columns,
                        pkColumn: pkColumn,
                        pkValue: pkValue,
                        data: results[0]
                    };
                    res.render('mainFrame', context);
                });
            });
    },

    // ========================================
    // 수정 처리
    // ========================================
    update_process: (req, res) => {
        var tableName = req.params.tableName;
        var post = req.body;
        var pkColumn = post._pkColumn;
        var pkValue = post._pkValue;

        db.query(
            `SELECT COLUMN_NAME, EXTRA, COLUMN_KEY
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ?
             ORDER BY ORDINAL_POSITION`,
            [tableName], (err, columns) => {
                if (err) { res.redirect('/table/view/' + tableName); return; }

                var sets = [];
                var vals = [];
                columns.forEach(col => {
                    // PK, auto_increment 제외
                    if (col.COLUMN_KEY !== 'PRI' && col.EXTRA !== 'auto_increment' && post[col.COLUMN_NAME] !== undefined) {
                        sets.push('`' + col.COLUMN_NAME + '` = ?');
                        vals.push(post[col.COLUMN_NAME]);
                    }
                });

                vals.push(pkValue);
                var sql = `UPDATE \`${tableName}\` SET ${sets.join(', ')} WHERE \`${pkColumn}\` = ?`;
                db.query(sql, vals, (err2) => {
                    if (err2) {
                        res.send('<script>alert("수정 실패: ' + err2.message.replace(/'/g, "\\'") + '"); history.back();</script>');
                        return;
                    }
                    res.redirect('/table/view/' + tableName);
                });
            });
    },

    // ========================================
    // 삭제
    // ========================================
    delete_process: (req, res) => {
        var tableName = req.params.tableName;
        var pkValue = req.params.pkValue;

        // PK 컬럼 찾기
        db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = 'webdb2026' AND TABLE_NAME = ? AND COLUMN_KEY = 'PRI'
             LIMIT 1`,
            [tableName], (err, results) => {
                if (err || results.length === 0) { res.redirect('/table/view/' + tableName); return; }

                var pkColumn = results[0].COLUMN_NAME;
                db.query(`DELETE FROM \`${tableName}\` WHERE \`${pkColumn}\` = ?`, [pkValue], (err2) => {
                    if (err2) {
                        res.send('<script>alert("삭제 실패: ' + err2.message.replace(/'/g, "\\'") + '"); history.back();</script>');
                        return;
                    }
                    res.redirect('/table/view/' + tableName);
                });
            });
    }
};
