var express = require('express');
var router = express.Router();
var db = require('../config/db');

var moment = require('moment');
var moment = require('moment-timezone');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


//REQ: userId RES: JSON
//메인화면 데이터 로딩 (1. loadSettings, 2. loadHistory)
router.get('/loadMain', isAuthenticated, function (req, res, next) {
    
    //[1] loadSettings
    var examAddress, subjectIds, examTitle;
    var querySelectSettings = "SELECT exam_address, subject_ids FROM user_settings WHERE user_id = ?";
    var querySelectExamCat = "(SELECT title FROM exam_cat0 WHERE id = ?) UNION (SELECT title FROM exam_cat1 WHERE id = ?) UNION (SELECT title FROM exam_cat2 WHERE id = ?)"
    //user_settings의 exam_address와 subject_ids로 id->이름 불러옴
    db.get().query(querySelectSettings, req.query.userId, function (err, rows1) {
        if (err) return res.status(400).send(err);
        
        //반드시 rows1[0].exam_address으로 검사
        if(rows1[0].exam_address == undefined) {            
            return res.sendStatus(401);
        } 
        else {
            examAddress = rows1[0].exam_address.split('_');
            subjectIds = rows1[0].subject_ids;
        }

        db.get().query(querySelectExamCat, [examAddress[0], examAddress[1], examAddress[2]], function (err, rows2) {

            //공무원
            if(examAddress[0] == 1) {
                examTitle = rows2[1].title + " · " + rows2[2].title;
            } 
            //이외
            else {
                examTitle = rows2[0].title + " · " + rows2[1].title;
            }
            
            var querySelectSubjects = "SELECT title FROM subjects WHERE id IN (" + rows1[0].subject_ids + ")";
            db.get().query(querySelectSubjects, function (err, rows3) {
                if (err) return res.status(400).send(err);

                //console.log(moment().tz("Asia/Seoul").format('YYYY-MM-DD HH:mm'));
                var nowTime = moment().tz("Asia/Seoul").format('YYYY-MM-DD');
                var querySelectGoals = "SELECT today_goal AS todayGoal, subject_goals AS subjectGoals FROM user_goals WHERE user_id = ? ORDER BY id DESC LIMIT 1";
             
                //console.log(subjectIds);

                var querySelectHistory = "SELECT subject_id AS subjectId, SUM(term) AS subjectTotal FROM histories WHERE user_id = ? AND exam_address = ? AND subject_id IN (" + subjectIds + ") AND end_point >= ? GROUP BY subject_id";
                //[2] LoadHistory
                db.get().query(querySelectGoals, [req.query.userId, req.query.userId], function (err, rows4) {
                    if (err) return res.status(400).send(err);
                    
                    //goal 없는 아이디 접근 가능 코드 (앞으로의 유저는 문제 없음)
                    if (rows4[0] == undefined) {
                        rows4[0] = {
                            todayGoal : 3600,
                            subject_goals : ""
                        }
                    }
                    
                    db.get().query(querySelectHistory, [req.query.userId, rows1[0].exam_address, nowTime], function (err, rows5) {
                        if (err) return res.status(400).send(err);
                        var todayTotal = 0;
                        for (var i in rows5) {
                            todayTotal = todayTotal + rows5[i].subjectTotal;
                        }
                        
                        var loadSettingsResult = {
                            "settings": {
                                "examTitle": examTitle,
                                "subjectTitles": rows3,
                                "examAddress": rows1[0].exam_address,
                                "subjectIds": rows1[0].subject_ids
                            },
                            "history": {
                                "goals" : rows4[0],
                                "todayTotal": todayTotal, 
                                "subjectHistory": rows5
                            }
                        }

                        return res.status(200).send(loadSettingsResult);

                    });


                });

            });
        });
    });
    
});

//REQ: userId, totalGoal
// 임시 골 설정 (삭제 예정)
router.post('/setTotalGoal', isAuthenticated, function (req, res, next) {
    var nowTime = moment().format('YYYY-MM-DD');
    //console.log(nowTime);
    
    var queryInsertGoals = "INSERT INTO user_goals (user_id, today_goal, reg_time) VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE today_goal = ?, reg_time = ?";
    db.get().query(queryInsertGoals, [req.body.userId, req.body.totalGoal, nowTime, req.body.totalGoal, nowTime], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });

});


//REQ: userId, subjectGoals
router.post('/setGoal', isAuthenticated, function (req, res, next) {
    var nowTime = moment().format('YYYY-MM-DD');    
    
    //todayGoal(총합) 구하기
    var todayGoal = 0;
    var subjectGoals = [[]];
    var subjectGoalsLine = req.body.subjectGoals.split(',');
    
    for(var i = 0; i<subjectGoalsLine.length; i++) {
        subjectGoals[i] = subjectGoalsLine[i].split(':');
    }
    for(var i = 0; i<subjectGoals.length; i++) {
        todayGoal += parseInt(subjectGoals[i][1]);
    }
    
    var queryInsertGoal = "INSERT INTO user_goals (user_id, today_goal, subject_goals, reg_time) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE today_goal = ?, subject_goals = ?, reg_time = ?";
    db.get().query(queryInsertGoal, [req.body.userId, todayGoal, req.body.subjectGoals, nowTime, todayGoal, req.body.subjectGoals, nowTime], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.sendStatus(200);
        }
    });
  
});

// 스톱워치 정지 기능
// REQ: userId, examaddress, subjectId, studyId, startPoint, endPoint, term
router.post('/stop', isAuthenticated, function (req, res, next) {
    var queryInsertData = "INSERT INTO histories (user_id, exam_address, subject_id, study_id, start_point, end_point, term) VALUES (?, ?, ?, ?, ?, ?, ?);";
    //var queryDuplicateData =
    db.get().query(queryInsertData, [req.body.userId, req.body.examAddress, req.body.subjectId, req.body.studyId, req.body.startPoint, req.body.endPoint, req.body.term], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.sendStatus(200);
        }
    });
})




module.exports = router;
