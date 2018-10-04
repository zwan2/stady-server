var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//REQ: userId RES: arr[], total_goal, subjects_goal
//메인화면 데이터 로딩
router.get('/loadMain', function (req, res, next) {
    /*
    var querySelectSettings = "SELECT exam_address, subject_ids FROM user_settings WHERE user_id = ?";
    var querySelectExamCat = "(SELECT title FROM exam_cat0 WHERE id = ?) UNION (SELECT title FROM exam_cat1 WHERE id = ?) UNION (SELECT title FROM exam_cat2 WHERE id = ?)"
    var examTitle;
    //user_settings의 exam_address와 subject_ids로 id->이름 불러옴
    //1. loadSettings
    db.get().query(querySelectSettings, req.query.userId, function (err, rows1) {
        if (err) return res.status(400).send(err);
        var examAddress = rows1[0].exam_address.split('_');

        db.get().query(querySelectExamCat, [examAddress[0], examAddress[1], examAddress[2]], function (err, rows2) {

            //공무원
            if(examAddress[0] = 1) {
                examTitle = rows2[1].title + " · " + rows2[2].title;
            } 
            //이외
            else {
                examTitle = rows2[1].title + " · " + rows2[2].title;
            }
           
            //과목명
            var querySelectSubjects = "SELECT title FROM subjects WHERE id IN (" + rows1[0].subject_ids + ")";
            db.get().query(querySelectSubjects, function (err, rows) {
                return res.status(200).send(rows);
            });
        });
        
    });
    */
 
    
    var querySelectGoals = "SELECT total_goal, subjects_goal FROM user_goals WHERE user_id = ? ORDER BY reg_time DESC LIMIT 1";
    //var querySelectHistory = "SELECT subject_id, study_id, SUM(term) as term FROM histories WHERE user_id = ?";
    var querySelectHistory = "SELECT subject_id, study_id, SUM(term) " + "term_sum" + " FROM histories WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND end_point < curdate( ) GROUP BY subject_id AND study_id";

    db.get().query(querySelectGoals, [req.query.userId, req.query.userId], function (err, rows1) {
        if (err) return res.status(400).send(err);
        db.get().query(querySelectHistory, [req.query.userId, req.query.userId], function (err, rows2) {
            //console.log(rows1[0]);
            if (err) return res.status(400).send(err);

            if (rows2 == 0) {
                return res.status(200).send(JSON.stringify(rows1[0]));
            } else {
                var rows = Object.assign(rows1[0], rows2);
                console.log(rows);
                return res.status(200).send(JSON.stringify(rows));

            }

        });


    });
    
});

//REQ: userId, totalGoal
router.post('/setTotalGoal', function (req, res, next) {
   
    var queryInsertGoals = "INSERT INTO user_goals (user_id, exam_address, total_goal) VALUES(?, (SELECT exam_address FROM user_settings WHERE user_id = ?), ?)";
    db.get().query(queryInsertGoals, [req.body.userId, req.body.userId, req.body.totalGoal], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });

});
/*
//REQ: userId, examAddress
//유저의 골, 최근 정보 가져오기
//과목별 공부방법별 텀
router.get('/loadMain', function (req, res, next) {
    var querySelectGoal = "SELECT goal_setting FROM user_goals WHERE user_id = ? AND exam_address = ?";
    var querySelectHistory = "SELECT subject_id, study_id, SUM(term) FROM histories WHERE user_id = ? AND exam_address = ? AND start_point > DATE_SUB(NOW(), INTERVAL 1 day) GROUP BY subject_id AND study_id";
    //var querySelectGoalHistory = "SELECT goal_setting FROM user_goals WHERE user_id = ? AND exam_address = ? UNION SELECT subject_id, study_id, term FROM histories WHERE user_id = ? AND exam_address = ? AND start_point > DATE_SUB(NOW(), INTERVAL 1 day)";
    db.get().query(querySelectGoal, [req.query.userId, req.query.examAddress], function (err, rows1) {
        if (err) {
            return res.status(400).send(err);
        } else {

            db.get().query(querySelectHistory, [req.query.userId, req.query.examAddress], function (err, rows2) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    console.log(rows1[0]);
                    console.log(rows2[0]);

                    //if (rows2.subject_id 같은 것끼리, rows2.study_id 같은 것끼리 term 합치기)

                    var rows = Object.assign(rows1[0], rows2[0]);
                    return res.status(200).send(JSON.stringify(rows));
                }

            });
        }

    });
});
*/

// 스톱워치 정지 기능
// REQ: userId, examaddress, subjectId, studyId, startPoint, endPoint, term
router.post('/stop', function(req, res, next) {
    var queryInsertData = "INSERT INTO histories (user_id, exam_address, subject_id, study_id, start_point, end_point, term) VALUES (?, ?, ?, ?, ?, ?, ?);";
     db.get().query(queryInsertData, [req.body.userId, req.body.examAddress, req.body.subjectId, req.body.studyId, req.body.startPoint, req.body.endPoint, req.body.term], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.sendStatus(200);
        }
    });
})



// socket - 스톱워치 시작
router.post('/start', function(req, res, next) {

});


module.exports = router;
