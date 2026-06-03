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
    // 지역별 고객 분포
    customer: (req, res) => {
        var { name, login, cls } = authIsOwner(req);
        // CEO(경영자) 클래스 체크 - person 테이블의 cls가 'CEO' 등일 수 있음
        // PDF에서 "경영진"이라 표시되어있으므로 CEO로 가정
        // 관리자(MNG)도 볼 수 있게 허용
        if (cls !== 'CEO' && cls !== 'MNG') { res.redirect('/'); return; }

        db.query(
            `SELECT address,
                    ROUND((COUNT(*) / (SELECT COUNT(*) FROM person)) * 100, 2) AS rate
             FROM person
             GROUP BY address`,
            (err, results) => {
                if (err) results = [];
                var context = {
                    who: name, login: login, body: 'anal', cls: cls,
                    percentage: results
                };
                res.render('mainFrame', context);
            });
    }
};
