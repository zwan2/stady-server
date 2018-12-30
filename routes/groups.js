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
        password = '';
    } else if (password == undefined || password.length == 0) {
        return res.sendStatus(400);
    }
    

    //Insert
    var queryInsertGroup = "INSERT INTO groups (title, content, visibility, password, color, emoji, master_id, user_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.get().query(queryInsertGroup, [title, content, visibility, password, color, emoji, userId, userId], function (err, rows) {
        if (err) return res.status(400).send(err);

        //Update to add user groupId in user_settings
        // var queryUpdateUsers = "UPDATE user_settings SET group_ids = CONCAT(group_ids, ?) WHERE user_id = ?";
        // db.get().query(queryUpdateUsers, ["," + req.body.groupId, req.body.userId], function (err, rows) {
        //     if (err) return res.status(400).send(err);

        //     return res.sendStatus(200);
        // });
        return res.sendStatus(200);
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


//그룹 검색
//REQ: searchWord, startPoint 최초: 0
router.get('/search', function (req, res, next) {
    //REQ
    const startPoint = req.query.startPoint;

    //임시 쿼리
    var searchWord = "";
    searchWord = searchWord.concat("'%", req.query.searchWord, "%'");
    console.log(searchWord);
    
    var querySelectGroup = "SELECT id, title, content, visibility, color, emoji, user_ids AS userIds, master_id AS masterId FROM groups WHERE title LIKE " + searchWord + " LIMIT " + startPoint + ", 20";
 
    //var querySelectGroup = "SELECT title, content FROM groups WHERE MATCH(title, content) AGAINST (?)";

    db.get().query(querySelectGroup, [], function (err, rows) {
        if (err) return res.status(400).send(err);

        //Count the number of users in each group.
        for (var i in rows) {
            rows[i].userCount = getUserCount(rows[i].userIds);
        }
        
        return res.status(200).send(rows);
    });
});


//그룹 가입
//REQ: userId, groupId, password(default: '')
router.post('/join', function(req, res, next) {

    //REQ
    const groupId = req.body.groupId;
    const password = req.body.password;
    const userId = req.body.userId;

    //select where id = groupId => visibility, password
    var querySelectGroups = "SELECT user_ids AS userIds, visibility, password FROM groups WHERE id = ? LIMIT 1";
    db.get().query(querySelectGroups, groupId, function (err, rows) {
        if (err) return res.status(400).send(err);

        //이미 그룹에 가입한 유저인지 체크 (중복 체크)
        var userIds = rows[0].userIds.split(",");
        if (userIds.includes(userId)) {
            //중복!
            return res.status(400).send('Duplicated');
        }

        //visibility가 0이면서 비밀번호가 맞는 상황과, visibility가 1이면 바로 가입 성공 처리
        if ((rows[0].visibility == 0 && rows[0].password == password) || rows[0].visibility == 1) {
            //Success
            var queryUpdategroups = "UPDATE groups SET user_ids = CONCAT(user_ids, ?) WHERE id = ? ";
            db.get().query(queryUpdategroups, ["," + userId, groupId], function (err, rows) {
                if (err) return res.status(400).send(err);
                return res.sendStatus(200);
            });
        } else {
            //Fail
            res.sendStatus(401);
        }
    });

    // var querySelectGroups = "SELECT visibility, password FROM groups WHERE id = ?";
    // db.get().query(querySelectGroups, groupId, function (err, rows) {
    //     if(rows[0].visibility == 0) {
    //         var queryUpdategroups = "UPDATE groups SET user_ids = CONCAT(user_ids, ?) WHERE id = ? ";       
    //     }

    //     var querySelectGroups2 = "SELECT COUNT(*) AS count FROM groups WHERE id = ? AND password = ? AND IF(FIND_IN_SET(? , user_ids), 'T', 'F') = 'F' LIMIT 1";
    //     //var queryUpdateUsers = "UPDATE user_settings SET group_ids = CONCAT(group_ids, ?) WHERE user_id = ?";
    //     var queryUpdategroups = "UPDATE groups SET user_ids = CONCAT(user_ids, ?) WHERE id = ? ";
        
    //     //유효 검사 (그룹 id, pw 일치하는 경우 AND 그룹 가입하지 않은 유저인 경우)
    //     db.get().query(querySelectGroups2, [groupId, password, userId], function (err, rows) {
    //         if (err) return res.status(400).send(err);
    //         console.log(rows[0].count);
            
    //         //유효한 가입인 경우
    //         if (rows[0].count == 1) {
                
    //             db.get().query(queryUpdategroups, ["," + userId, groupId], function (err, rows) {
    //                 if (err) return res.status(400).send(err);
    //                 return res.sendStatus(200);
    //             });
    //         } 
    //         //유효하지 않은 가입인 경우
    //         else {
    //             return res.sendStatus(401);
    //         }
    
    //     });
    // });
});

//유저 탈퇴 (일반 유저)
//REQ: userId, groupId
router.post('/leave', function (req, res, next) {
    const userId = req.body.userId;
    const groupId = req.body.groupId;
    var querySelectGroups = "SELECT master_id, user_ids FROM groups WHERE id = ?";
    var queryUpdateGroups = "UPDATE groups SET user_ids = ? WHERE id = ?";
    db.get().query(querySelectGroups, groupId, function (err, rows) {
        if (err) return res.status(400).send(err);
        
        //마스터 유저 예외 처리
        if(rows[0].master_id == userId) {
            return res.sendStatus(400);
        } else {    
            //var replaceUserIds = rows[0].user_ids.replace("," + userId, "");
            var userIds = rows[0].user_ids.split(',');
            for (var i in userIds) {
                if (userIds[i] == userId) {
                    userIds.splice(i, 1);
                }
            }
            var sUserIds = userIds.join(',');

            //console.log(replaceUserIds);
            
            db.get().query(queryUpdateGroups, [sUserIds, groupId], function (err, rows) {
                if (err) return res.status(400).send(err);
                return res.sendStatus(200);
            });
        }

    });

});

//그룹 삭제 
//REQ: uesrId, groupId
router.post('/withdrawal', function(req, res ,next) {
    const userId = req.body.userId;
    const groupId = req.body.groupId;
    var queryDeleteGroups = "DELETE FROM groups WHERE master_id = ? AND id = ?";
    db.get().query(queryDeleteGroups, [userId, groupId], function (err, rows) {
        if (err) return res.status(400).send(err);
        
        //로그용
        if (rows.affectedRows == 0) {
            console.log('fail');
        } else {
            console.log('success');
        }

        return res.sendStatus(200);
    });

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
