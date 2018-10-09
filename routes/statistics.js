var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');


function loadDdayData(tartgetTime, userId) {
    if(targetTime == undefined) {
        var targetTime = moment().format('YYYY-MM-DD');
    }
    var querySelectHistories = "SELECT SUM(term) AS total_time, SUM(term) / (SELECT today_goal FROM user_goals WHERE reg_time <= ? + 1 LIMIT 1) AS goal_completion_rate, " +
        + "SUM(term) / COUNT(term) AS concentration_time FROM histories " +
        + "WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND end_point >= ?";

    db.get().query(querySelectHistories, [req.query.targetTime, req.query.userId, req.query.targetTime], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });
}

//REQ: targetTime(미지정시 오늘), userId
//1일치 정보(총공부시간,목표달성률,연속집중력) 불러오기
router.get('loadDay', function(req, res, next) {
    var result1 = loadDayData(req.query.targetTime, req.query.userId);

});

router.get('/loadSummaryData', function(req, res, next) {
    var nowTime = moment().format('YYYY-MM-DD');
    console.log(nowTime);
    
    var querySelectHistories = "SELECT subject_id, study_id, SUM(term) total_time, COUNT(term) stop_count FROM histories WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?) AND end_point > ? GROUP BY subject_id, study_id";
    db.get().query(querySelectHistories, [req.query.userId, req.query.userId, nowTime], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });

});

//시험별 통계치(통계명, 통계값) 불러옴
//(확장성을 위해서 통계명-통계값 쌍을 불러오도록 했는데.. 순서를 서로 합의하고 통계값만 주루룩 불러와도 됨.)
//통계 - 시험탭
router.get('/loadExamData', function(req,res,next) {
    var querySelectStatistics = "SELECT id, title, content, base_date FROM histories_statistics WHERE exam_address = ?";
    db.get().query(querySelectStatistics, req.query.examAddress, function (err, rows1) {
        if (err) {
            return res.status(400).send(err);
        } else {
           return res.status(200).send(JSON.stringify(rows));
        }
    });
});


//[{"exam_address":"0,0,0","subject_id":1,"study_id":0,"m":"2018-09","SUM(term)":8,"count(term)":1},{"exam_address":"0_0_0","subject_id":1,"study_id":0,"m":"2018-09","SUM(term)":100669,"count(term)":41},{"exam_address":"0_0_0","subject_id":1,"study_id":2,"m":"2018-09","SUM(term)":1,"count(term)":1},{"exam_address":"0_0_0","subject_id":1,"study_id":3,"m":"2018-09","SUM(term)":1,"count(term)":1},{"exam_address":"0_0_0","subject_id":2,"study_id":0,"m":"2018-09","SUM(term)":2487,"count(term)":12},{"exam_address":"0_0_0","subject_id":3,"study_id":0,"m":"2018-09","SUM(term)":12,"count(term)":4},{"exam_address":"0_0_0","subject_id":4,"study_id":0,"m":"2018-09","SUM(term)":4,"count(term)":1},{"exam_address":"0_0_0","subject_id":5,"study_id":0,"m":"2018-09","SUM(term)":7,"count(term)":1},{"exam_address":"0_0_0","subject_id":6,"study_id":0,"m":"2018-09","SUM(term)":15,"count(term)":1},{"exam_address":"1_30_2","subject_id":4,"study_id":1,"m":"2018-09","SUM(term)":1620,"count(term)":27}]
//history에서 바로 불러옴.
//월별 통계 불러오기(임시)
//REQ: userId, year(INT, 2018), month(INT, 09)
router.get('/loadPeriodData', function(req, res, next) {
    var base_date = req.query.year + '-' + req.query.month + '-%';
    //console.log(base_date);
    
    var querySelectHistories = "SELECT subject_id, study_id, SUM(term) total_time, COUNT(term) stop_count FROM histories WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?) AND end_point LIKE ? GROUP BY DATE_FORMAT(end_point, '%Y-%m'), exam_address, subject_id, study_id";
    //var querySelectHistories = "SELECT exam_address FROM user_settings WHERE user_id = ?";
    db.get().query(querySelectHistories, [req.query.userId, req.query.userId, base_date], function (err, rows) {
        if (err) {
            return res.status(400).send(err);
        } else {
            return res.status(200).send(JSON.stringify(rows));
        }
    });  
});

module.exports = router;
