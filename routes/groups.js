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

//내 그룹 목록
router.get('/myList/:userId', function (req, res, next) {

    var querySelectUsers = "SELECT group_ids FROM users WHERE id = ?";
    db.get().query(querySelectUsers, [req.params.userId], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            var groupIds = JSON.stringify(rows).replace(",","|");
            var querySelectUsers = "SELECT group_ids FROM groups WHERE id = ?";
            db.get().query(querySelectUsers, [req.params.userId], function (err, rows) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                
                }
            }
        };
    });
});

module.exports = router;
