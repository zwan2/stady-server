var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');

//var tableNameArray = ['data_national', 'data_sat', 'data_teacher', 'data_cert'];


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


// 스톱워치 정지 기능
// REQ: userId, examId, subjectId, studyId, startTime, endTime, term
router.post('/stop', function(req, res, next) {
    var queryInsertData = "INSERT INTO data (user_id, exam_id, subject_id, study_id, start_time, end_time, term) VALUES (?, ?, ?, ?, ?, ?);";
     db.get().query(queryInsertData, [req.body.userId, req.body.examId, req.body.subjectId, req.body.studyId, req.body.startTime, req.body.endTime, req.body.term], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(JSON.stringify(rows[0]));
        }
    });
})



/*
// 스톱워치 시작 기능
// 데이터 테이블, 데이터-유저 관계 테이블 추가
// REQ: userId, examId, studyId, dataTableCode
router.post('/start', function (req, res, next) {
    var tableName = tableNameArray[req.body.dataTableCode]; 
    var studyDate = moment().format('YYYY-MM-DD');
    
    //1. INSERT data TABLE
    var queryInsertData = "INSERT INTO ?? (user_id, exam_id, study_id) VALUES (?, ?, ?);";
    //2. usersData 있으면 daily data에 추가, 없으면 INSERT
    //var queryInsertUsersData = "INSERT INTO users_data (user_id, data_table_code, study_date) VALUES (?, ?, ?);"
    //var queryInsertUsersData = "INSERT INTO users_data (user_id, data_table_code, study_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE daily_data = IF(user_id = ?, CONCAT(daily_data, ?), NULL);"
    var queryInsertUsersData = "INSERT INTO users_data (user_id, data_table_code, study_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE daily_data = IF(user_id = ?, 'y', 'n');"
    db.get().query(queryInsertData, [tableName, req.body.userId, req.body.examId, req.body.studyId], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            console.log (rows.insertId);
            //, "," + rows.insertId
            db.get().query(queryInsertUsersData, [req.body.userId, req.body.dataTableCode, studyDate, req.body.userId], function (err, rows2) {
                if (err) {
                    return res.status(400).send(err);
                } else {
                    
                    return res.status(200).send(JSON.stringify(rows2.insertId));
                }
            }); 
        };
    });
    
});
*/

module.exports = router;
