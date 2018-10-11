var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');

/*
function loadDayStat (targetTime, userId, callback) {
    
    if(targetTime == undefined) {
        var targetTime = moment().format('YYYY-MM-DD');
    }
    

    var tomorrowTime = moment(targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");

    var querySelectHistories = "SELECT SUM(term) AS total_time, (SUM(term) / (SELECT today_goal FROM user_goals WHERE reg_time < ? ORDER BY reg_time DESC LIMIT 1))" +
        "AS goal_completion_rate, (SUM(term) / COUNT(term)) AS concentration_time FROM histories WHERE user_id = ?" +
        "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND end_point >= ?";

    db.get().query(querySelectHistories, [tomorrowTime, userId, userId, targetTime], function (err, rows) {
        //if (err) callback(err, null);
        console.log(rows);

        callback(null, JSON.stringify(rows));
        //return JSON.stringify(rows);
    });
  
    
}
*/

//1일치 정보(총공부시간,목표달성률,연속집중력) 불러오기
//req: targetTime, userId
router.get('/loadDayStat', function(req, res, next) {
    
    var tomorrowTime = moment(req.query.targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");
    
    //SELECT common
    var querySelectHistories = "SELECT SUM(term) AS total, (SELECT today_goal FROM user_goals WHERE reg_time < ? ORDER BY reg_time DESC LIMIT 1) AS goal,"
    +"(SELECT subject_ids FROM user_settings WHERE user_id = ?) AS subjectIds, COUNT(term) term_count FROM histories WHERE user_id = ?"
    + "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND end_point >= ?";
    
    //SELECT subject
    var querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?"
                                +" AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)"
                                +" AND h.end_point >= ? GROUP BY h.subject_id, h.study_id";
                                
    db.get().query(querySelectHistories, [tomorrowTime, req.query.userId, req.query.userId, req.query.userId, req.query.targetTime], function (err, rows1) {
        if (err) return res.status(400).send(err);
            
        db.get().query(querySelectHistories2, [req.query.userId, req.query.userId, req.query.targetTime], function (err, rows2) {
            if (err) return res.status(400).send(err);

            var subjectIds = rows1[0].subjectIds;
            var subjectIdsArray = subjectIds.split(",");

            var querySelectSubjects = "SELECT title FROM subjects WHERE id IN (" + subjectIds + ")";
            db.get().query(querySelectSubjects, function (err, rows3) {
                if (err) return res.status(400).send(err);

                var names = [], totals = [];
                for (var i = 0; i < rows3.length; i++) {
                    names.push(rows3[i].title);
                }
                
                for (var i = 0; i < subjectIdsArray.length; i++) {
                    var terms  = [0, 0, 0, 0];
                    for (var j =0; j < rows2.length; j++) {
                        if (subjectIdsArray[i] == rows2[j].subject_id) {
                            terms[rows2[j].study_id] = rows2[j].term;
                        }
                    }
                    totals.push(terms);
                }

                var subject = {
                    totals: totals,
                    names: names
                }
                var total = rows1[0].total == null ? 0 : rows1[0].total;
                var termCount = rows1[0].term_count == null ? 0 : rows1[0].term_count;
                var continuousConcentration = parseInt(total/termCount);

                var loadDayStatResult = {
                    total: rows1[0].total == null ? 0 : rows1[0].total,
                    goal: rows1[0].goal == null ? 0 : rows1[0].goal,
                    achievementRate: rows1[0].total / rows1[0].goal * 100,
                    continuousConcentration: continuousConcentration == null || "null" ? 0 : continuousConcentration,
                    subject: subject
                }
                return res.status(200).send(loadDayStatResult);
                
            });
        });
    });
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
