var express = require('express');
var router = express.Router();
var db = require('../config/db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//그룹 생성
//REQ: examId, openOption, title, subtitle, masterUserId, groupUsersIds
router.post('/create', function (req, res, next) {
    var queryInsertGroups = "INSERT INTO groups (exam_id, open_option, title, subtitle, master_user_id, group_users_ids) VALUES (?, ?, ?, ?, ?, ?);";
    db.get().query(queryInsertGroups, [req.body.examId, req.body.openOption, req.body.title, req.body.subtitle, req.body.masterUserId, req.body.groupUsersIds], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(JSON.stringify(rows[0]));
        };
    });
});

//그룹 리스트 뷰 (가장 높은 id부터 내림차로 로딩함) 현재까지 로딩된 데이터의 개수 + 1을 
//REQ: startPoint (현재까지 로딩된 데이터의 개수)
router.get('/list/:startPoint', function (req, res, next) {

    var querySelectGroups = "SELECT id, exam_id, title, subtitle, count_users, master_user_id FROM groups WHERE open_option = 1 ORDER BY id DESC LIMIT " + req.params.startPoint + ", 5;";

    db.get().query(querySelectGroups, function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(JSON.stringify(rows));
        };
    });
});

//내 그룹 목록(메인)
//REQ: userId RES: {"title":"공시","open_option":0,"subtitle":"","count_users":1,"master_user_id":1}
router.get('/myList/:userId', function (req, res, next) {
    var querySelectUsers = "SELECT group_ids FROM users WHERE id = ?";
    db.get().query(querySelectUsers, [req.params.userId], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            var groupIds = rows[0].group_ids;
    
            var querySelectUsers = "SELECT (SELECT title FROM exams e WHERE e.id =  g.exam_id) as title, open_option, title, subtitle, count_users, master_user_id FROM groups g WHERE id IN (" +groupIds +")";
            db.get().query(querySelectUsers, function (err, rows) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    return res.status(200).send(JSON.stringify(rows));
                }
            });
        };
    });
});

//그룹 클릭 시 상세정보
//유저가 가입한 그룹인지 아닌지 구분해야함.
router.get('/info', function (req, res, next) {

});

//그룹 가입
//REQ: userId, groupId
router.post('/join', function(req, res, next) {
    var queryUpdateUsers = "UPDATE users SET group_ids = CONCAT(group_ids, ?) WHERE id = ?";
    var queryUpdateGroups = "UPDATE groups SET group_users_ids = CONCAT(group_users_ids, ?), count_users = count_users + 1 WHERE id = ? ";
    db.get().query(queryUpdateUsers, ["," + req.body.groupId, req.body.userId], function (err, rows) {
        db.get().query(queryUpdateGroups,["," + req.body.userId, req.body.groupId], function (err, rows) {
            if (err) {
                return res.status(400).send(err);
            } else {
                return res.status(200).send(JSON.stringify(rows));
            }
        });
    });
});

module.exports = router;
