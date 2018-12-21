var express = require('express');
var router = express.Router();
var db = require('../config/db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//그룹 리스트 뷰 (가장 높은 id부터 내림차로 로딩함) 현재까지 로딩된 데이터의 개수 + 1을 
//REQ: startPoint (현재까지 로딩된 데이터의 개수)
router.get('/fullList', function (req, res, next) {

    var querySelectgroup = "SELECT id, exam_id, title, subtitle, user_count, master_user_id FROM group WHERE open_option = 1 ORDER BY id DESC LIMIT " + req.query.startPoint + ", 5;";

    db.get().query(querySelectgroup, function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(JSON.stringify(rows));
        };
    });
});

//내 그룹 목록(메인)
//REQ: userId RES: {"title":"공시","open_option":0,"subtitle":"","user_count":1,"master_user_id":1}
router.get('/getMyGroups', function (req, res, next) {
    var querySelectUsers = "SELECT id, title, color, emoji, user_count FROM groups WHERE group_users_ids IN (" + req.query.userId + ")";
    db.get().query(querySelectUsers, [req.query.userId], function (err, rows) {
        if (err) return res.status(400).send(err);

        return res.status(200).send(rows);
    });
});

//그룹 클릭 시 유저들의 상세정보
router.get('/getUsersInGroup', function (req, res, next) {
    var querySelectUsers = "SELECT , title, color, emoji, user_count FROM groups WHERE group_users_ids IN (" + req.query.userId + ")";

});

//그룹 생성
//REQ: examId, openOption, title, subtitle, masterUserId, groupUsersIds
router.post('/create', function (req, res, next) {
    var queryInsertgroup = "INSERT INTO group (exam_id, open_option, title, subtitle, master_user_id, group_users_ids) VALUES (?, ?, ?, ?, ?, ?);";
    db.get().query(queryInsertgroup, [req.body.examId, req.body.openOption, req.body.title, req.body.subtitle, req.body.masterUserId, req.body.masterUserId], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.sendStatus(200);
        };
    });
});

//그룹 가입
//REQ: userId, groupId
router.post('/join', function(req, res, next) {
    var queryUpdateUsers = "UPDATE users SET group_ids = CONCAT(group_ids, ?) WHERE id = ?";
    var queryUpdategroup = "UPDATE group SET group_users_ids = CONCAT(group_users_ids, ?), user_count = user_count + 1 WHERE id = ? ";
    db.get().query(queryUpdateUsers, ["," + req.body.groupId, req.body.userId], function (err, rows) {
        db.get().query(queryUpdategroup,["," + req.body.userId, req.body.groupId], function (err, rows) {
            if (err) {
                return res.status(400).send(err);
            } else {
                return res.sendStatus(200);
            }
        });
    });
});

module.exports = router;
