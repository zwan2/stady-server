var express = require('express');
var router = express.Router();
var db = require('../config/db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//내 그룹 목록(메인)
//REQ: userId RES: {"title":"공시반","open_option":0,"subtitle":"","user_count":1,"master_user_id":1}
router.get('/getMyGroups', function (req, res, next) {
    var querySelectGroups = "SELECT id, title, content, color, emoji, user_count AS userCount FROM groups WHERE FIND_IN_SET(? , user_ids)";
    db.get().query(querySelectGroups, req.query.userId, function (err, rows) {  
        if (err) return res.status(400).send(err);
        return res.status(200).send(rows);
    });
});

//그룹 클릭 시 유저들의 상세정보
//REQ: groupId
router.get('/getUsers', function (req, res, next) {
    
    //1. getGroupUsersIds
    var querySelectIds = "SELECT user_ids FROM groups WHERE id = ?";

    db.get().query(querySelectIds, [req.query.groupId], function (err, rows1) {
        if (err) return res.status(400).send(err);
        
        //2. getSettings
        var querySelectSettings = "SELECT S.user_id AS id, S.name, S.emoji, S.color, (SELECT today_goal FROM user_goals as G WHERE G.user_id = S.user_id ORDER BY id DESC LIMIT 1) AS goal" +
            " FROM user_settings S WHERE S.user_id IN (" + rows1[0].user_ids+")";
        db.get().query(querySelectSettings, function (err, rows2) {
            if (err) return res.status(400).send(err);
            
            return res.status(200).send(rows2);
        });
    });
});


//그룹 이름 중복검사
//REQ: name
router.get('/checkDuplicate/name', isAuthenticated, function (req, res, next) {
    var name = req.query.name;
  
    if (name == null) {
      return res.sendStatus(400);
    }
  
    var sqlSelectName = "SELECT COUNT(*) AS count FROM groups WHERE title = ? LIMIT 1;";
    db.get().query(sqlSelectName, name, function (err, rows) {
      if (err) return sendError(res, err);
  
      if (rows[0].count != 0) {
        //중복 (재설정 필요)
        return res.status(200).send('Duplicated');
      }
      else {
        //중복X
        return res.sendStatus(200);
      }
    });
  });

//그룹 생성
//REQ: title, content, openOption, color, emoji, userId
router.post('/create', function (req, res, next) {
    var queryInsertGroup = "INSERT INTO groups (title, content, open_option, color, emoji, master_user_id, user_ids) VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.get().query(queryInsertGroup, [req.body.title, req.body.content, req.body.openOption, req.body.color, req.body.emoji, req.body.userId, req.body.userId], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.sendStatus(200);
        };
    });
});

- // //그룹 리스트 뷰 (가장 높은 id부터 내림차로 로딩함) 현재까지 로딩된 데이터의 개수 + 1을 
// //REQ: startPoint (현재까지 로딩된 데이터의 개수)
// router.get('/fullList', function (req, res, next) {

//     var querySelectgroup = "SELECT id, exam_id, title, subtitle, user_count, master_user_id FROM group WHERE open_option = 1 ORDER BY id DESC LIMIT " + req.query.startPoint + ", 5;";

//     db.get().query(querySelectgroup, function (err, rows) {
//         if (err) {
//             return res.status(400).send(err);
//         } else {
//             return res.status(200).send(JSON.stringify(rows));
//         };
//     });
// });


//그룹 검색
//REQ: searchWord, startPoint 최초: 0
router.get('/search', function (req, res, next) {
    //임시 쿼리
    var searchWord = "";
    searchWord = searchWord.concat("'%", req.query.searchWord, "%'");
    console.log(searchWord);
    
    var querySelectGroup = "SELECT id, title, content, open_option, color, emoji, user_count AS userCount FROM groups WHERE title LIKE " + searchWord + " LIMIT " + req.query.startPoint + ", 20";
 
    //var querySelectGroup = "SELECT title, content FROM groups WHERE MATCH(title, content) AGAINST (?)";

    db.get().query(querySelectGroup, [req.query.searchWord], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(rows);
        };
    });
});


//그룹 가입
//REQ: userId, groupId
router.post('/join', function(req, res, next) {
    var queryUpdateUsers = "UPDATE users SET group_ids = CONCAT(group_ids, ?) WHERE id = ?";
    var queryUpdategroup = "UPDATE group SET user_ids = CONCAT(user_ids, ?), user_count = user_count + 1 WHERE id = ? ";
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
