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

// socket - 스톱워치 시작
router.post('/start', function(req, res, next) {

});


module.exports = router;
