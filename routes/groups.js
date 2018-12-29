var express = require('express');
var router = express.Router();
var db = require('../config/db');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//내 그룹 목록(메인)
//REQ: userId
//RES: {"title":"공시반","visibility":0,"content":"","master_user_id":1}
router.get('/getMyGroups', function (req, res, next) {
    var querySelectGroups = "SELECT id, title, content, visibility, color, emoji, master_id AS masterId, user_ids AS userIds FROM groups WHERE FIND_IN_SET(? , user_ids)";
    db.get().query(querySelectGroups, req.query.userId, function (err, rows) {  
        if (err) return res.status(400).send(err);

        //Count the number of users in each group.
        for (var i in rows) {
            rows[i].userCount = getUserCount(rows[i].userIds);
            delete rows[i].userIds;
        }
        
        return res.status(200).send(rows);
    });
});

//특정 그룹 찾기
//REQ: groupId
//RES: [{"id":4,"title":"2019행정9급","content":"9급 공무원 !\r\n매일 3시간 이상씩 공부 기록하기\r\n카카오톡 단톡방에 공부 결과 링 스샷 업로드!\r\n매일 아침 9시까지 기상 인증하기\r\n모두모두 화이팅해요~🥰","visibility":0,"color":-13784,"emoji":"😁","masterId":143,"userCount":10}]
router.get('/getGroup', function (req, res, next) {
    //REQ
    const groupId = req.query.groupId;

    //Select Row
    var querySelectGroups = "SELECT id, title, content, visibility, color, emoji, master_id AS masterId, user_ids AS userIds FROM groups WHERE id = ?";
    db.get().query(querySelectGroups, groupId, function (err, rows) {  
        if (err) return res.status(400).send(err);

        console.log(rows[0]);
        

        //No content
        if (rows[0] == undefined) return res.sendStatus(204);

        //Count the number of users.
        rows[0].userCount = getUserCount(rows[0].userIds);
        delete rows[0].userIds;
        
        return res.status(200).send(rows[0]);
    });
});

//그룹 클릭 시 유저들의 상세정보
//REQ: groupId
router.get('/getUsers', function (req, res, next) {
    //REQ
    const groupId = req.query.groupId;

    //1. Find userIds corresponding to groupId
    var querySelectIds = "SELECT user_ids AS userIds FROM groups WHERE id = ?";
    db.get().query(querySelectIds, [groupId], function (err, rows1) {
        if (err) return res.status(400).send(err);

        const userIds = rows1[0].userIds;
        
        //2. Get detail user information of the group
        var querySelectSettings = "SELECT S.user_id AS id, S.name, S.emoji, S.color, (SELECT today_goal FROM user_goals as G WHERE G.user_id = S.user_id ORDER BY id DESC LIMIT 1) AS goal" +
            " FROM user_settings S WHERE S.user_id IN (" + userIds +")";
        db.get().query(querySelectSettings, function (err, rows2) {
            if (err) return res.status(400).send(err);
            
            return res.status(200).send(rows2);
        });
    });
});


//그룹 이름 중복검사
//REQ: name
//RES: OK or Duplicated
router.get('/checkDuplicate/name', isAuthenticated, function (req, res, next) {
    //REQ
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
//REQ: title, content, visibility, password, color, emoji, userId
router.post('/create', function (req, res, next) {
    //REQ
    const title = req.body.title;
    const content = req.body.content;
    const visibility = req.body.visibility;
    var password = req.body.password;
    const color = req.body.color;
    const emoji = req.body.emoji;
    const userId = req.body.userId;

    if (visibility == 1) {
        password = null;
    }

    //Insert
    var queryInsertGroup = "INSERT INTO groups (title, content, visibility, password, color, emoji, master_id, user_ids) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.get().query(queryInsertGroup, [title, content, visibility, password, color, emoji, userId, userId], function (err, rows) {
        if (err) return res.status(400).send(err);

        //Update to add user groupId in user_settings
        var queryUpdateUsers = "UPDATE user_settings SET group_ids = CONCAT(group_ids, ?) WHERE user_id = ?";
        db.get().query(queryUpdateUsers, ["," + req.body.groupId, req.body.userId], function (err, rows) {
            if (err) return res.status(400).send(err);

            return res.sendStatus(200);
        });
    });
});

//그룹 수정
//REQ: title, content, visibility, password, color, emoji, groupId
router.post('/modify', function (req, res, next) {
    //REQ
    const title = req.body.title;
    const content = req.body.content;
    const visibility = req.body.visibility;
    var password = req.body.password;
    const color = req.body.color;
    const emoji = req.body.emoji;
    const groupId = req.body.groupId;

    if (visibility == 1) {
        password = null;
    }

    //Update
    var queryUpdateGroup = "UPDATE groups SET title = ?, content = ?, visibility = ?, password = ?, color = ?, emoji = ? WHERE id = ?";
    db.get().query(queryUpdateGroup, [title, content, visibility, password, color, emoji, groupId], function (err, rows) {
        if (err) return res.status(400).send(err);

        return res.sendStatus(200);
    });
});


// //그룹 리스트 뷰 (가장 높은 id부터 내림차로 로딩함) 현재까지 로딩된 데이터의 개수 + 1을 
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

    //REQ
    const startPoint = req.query.startPoint;

    //임시 쿼리
    var searchWord = "";
    searchWord = searchWord.concat("'%", req.query.searchWord, "%'");
    console.log(searchWord);
    
    var querySelectGroup = "SELECT id, title, content, visibility, color, emoji, user_ids AS userIds FROM groups WHERE title LIKE " + searchWord + " LIMIT " + startPoint + ", 20";
 
    //var querySelectGroup = "SELECT title, content FROM groups WHERE MATCH(title, content) AGAINST (?)";

    db.get().query(querySelectGroup, [], function (err, rows) {
        if (err) return res.status(400).send(err);
        
        console.log(rows);

        //Count the number of users in each group.
        for (var i in rows) {
            rows[i].userCount = getUserCount(rows[i].userIds);
            delete rows[i].userIds;
        }
        
        return res.status(200).send(rows);
    });
});


//그룹 가입
//REQ: userId, groupId, password(default: 0)
router.post('/join', function(req, res, next) {

    //REQ
    const groupId = req.body.groupId;
    const password = req.body.password;
    const userId = req.body.userId;
    
    var querySelectGroups = "SELECT COUNT(*) AS count FROM groups WHERE id = ? AND password = ? AND IF(FIND_IN_SET(? , user_ids), 'T', 'F') = 'F' LIMIT 1";
    var queryUpdateUsers = "UPDATE user_settings SET group_ids = CONCAT(group_ids, ?) WHERE user_id = ?";
    var queryUpdategroups = "UPDATE groups SET user_ids = CONCAT(user_ids, ?) WHERE id = ? ";
    
    //유효 검사 (그룹 id, pw 일치하는 경우 AND 그룹 가입하지 않은 유저인 경우)
    db.get().query(querySelectGroups, [groupId, password, userId], function (err, rows) {
        if (err) return res.status(400).send(err);
        console.log(rows[0].count);
        
        //유효한 가입인 경우
        if (rows[0].count == 1) {
            db.get().query(queryUpdateUsers, ["," + groupId, userId], function (err, rows) {
                if (err) return res.status(400).send(err);
                //console.log(rows);
                
                db.get().query(queryUpdategroups, ["," + userId, groupId], function (err, rows) {
                    if (err) return res.status(400).send(err);
                    return res.sendStatus(200);
                });
            });
        } 
        //유효하지 않은 가입인 경우
        else {
            return res.sendStatus(401);
        }
   
    });
});

//REQ: userId, groupId
router.post('/withdrawal', function (req, res, next) {
    
});




/**
 * Count the number of users using userIds
 * @param {Target ids} userIds
 * @returns {Number of users}
 */
global.getUserCount = function(userIds) {
    var userCount = 0;
    if (userIds != null && userIds.length > 0) {
        userCount = userIds.split(",").length;
    }

    return userCount;
}




module.exports = router;
