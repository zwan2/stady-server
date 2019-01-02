var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');

function loadRank(avgT, avgAR, avgCC) {
    // var avgT = 3600; //Total
    // var avgAR = 90.6; //AchievementRate
    // var avgCC = 1800; //ContinuousConcentration

    var scoreT = getTotalScore(avgT);
    var scoreAR = getAchievementRateScore(avgAR);
    var scoreCC = getContinuousConcentrationScore(avgCC);

    return getRank(scoreT + scoreAR + scoreCC);;
}

function getTotalScore(total) {
    if (total >= 12 * 3600) {
        return 10;
    } else if (total >= 10 * 3600) {
        return 9;
    } else if (total >= 8 * 3600) {
        return 8;
    } else if (total >= 6 > 3600) {
        return 7;
    } else if (total >= 4 * 3600) {
        return 6;
    } else if (total >= 2 * 3600) {
        return 5;
    } else {
        return 3;
    }
}

function getAchievementRateScore(ar) {
    if (ar >= 90) {
        return 10;
    } else if (ar >= 80) {
        return 9;
    } else if (ar >= 70) {
        return 8;
    } else if (ar >= 60) {
        return 7;
    } else if (ar >= 50) {
        return 6;
    } else if (ar >= 40) {
        return 5;
    } else {
        return 0;
    }
}

function getContinuousConcentrationScore(cc) {
    if (cc >= 2 * 3600) {
        return 10;
    } else if (cc >= 1.5 * 3600) {
        return 9;
    } else if (cc >= 1.25 * 3600) {
        return 8;
    } else if (cc >= 1 * 3600) {
        return 7;
    } else if (cc >= 0.75 * 3600) {
        return 6;
    } else if (cc >= 0.5 * 3600) {
        return 5;
    } else {
        return 0;
    }
}

function getRank(score) {
    if (score >= 27) {
        return "A+";
    } else if (score >= 24) {
        return "A";
    } else if (score >= 21) {
        return "B+";
    } else if (score >= 18) {
        return "B";
    } else if (score >= 15) {
        return "C+";
    } else if (score >= 13) {
        return "C";
    } else {
        return "F";
    }
}


//1일치 정보(총공부시간,목표달성률,연속집중력) 불러오기
//req: targetTime, userId
router.get('/loadDayStat', isAuthenticated, function (req, res, next) {

    //if(req.query.targetTime==null)
    
    var tomorrowTime = moment(req.query.targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");

    //SELECT common
    var querySelectHistories = "SELECT SUM(term) AS total, (SELECT today_goal FROM user_goals WHERE reg_time < ? AND user_id = ? ORDER BY reg_time DESC LIMIT 1) AS goal,"
    +"(SELECT subject_ids FROM user_settings WHERE user_id = ?) AS subjectIds, COUNT(term) term_count FROM histories WHERE user_id = ?"
    + "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND DATE(end_point) = ?";
    
    //SELECT subject
    //약짬뽕(DB에서 h.term -> 서버 코드에서 합침)
    var querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?"
                                +" AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)"
                                +" AND DATE(h.end_point) = ? ORDER BY h.subject_id, h.study_id";


    
    db.get().query(querySelectHistories, [tomorrowTime, req.query.userId, req.query.userId, req.query.userId, req.query.userId, req.query.targetTime], function (err, rows1) {
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
                            terms[rows2[j].study_id] += rows2[j].term;
                        }
                    }
                    totals.push(terms);
                }

                var subject = {
                    totals: totals,
                    names: names
                }

                //console.log(rows1[0].total);
                //console.log(rows1[0].goal);
                
                var total = rows1[0].total == null ? 0 : rows1[0].total;
                var goal = rows1[0].goal == null ? 3600 : rows1[0].goal;
                var termCount = rows1[0].term_count == null ? 0 : rows1[0].term_count;
                //console.log(total+termCount);
                
                var continuousConcentration = termCount == 0 ? 0 : parseInt(total / termCount);
               
                var loadDayStatResult = {
                    total: total,
                    goal: goal,
                    achievementRate: total / goal * 100,
                    continuousConcentration: continuousConcentration,
                    //기존 graph
                    subject: subject

                }
                
                return res.status(200).send(loadDayStatResult);
                
            });
        });
    });


});
router.get('/test', isAuthenticated, function (req, res, next) {
    var targetTime = req.query.targetTime;
    var userId = req.query.userId;
    //2.1. 랭킹
    var querySelectHistories2 = "SELECT user_id, SUM(term) AS total FROM histories " 
                                +"WHERE exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) " 
                                +"AND DATE(end_point) = ? GROUP BY user_id "
                                + "HAVING user_id in (SELECT id FROM user_accounts) ORDER BY total DESC";

    //2.2. 비교 지표 - 유저들의 최대, 평균 공부시간
    var querySelectHistories3 = "SELECT MAX(term) AS MAX_T, AVG(term) AS AVG_T FROM histories "
                                + "WHERE exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) "
                                + "AND DATE(end_point) = ?";

    db.get().query(querySelectHistories2, [userId, targetTime], function (err, rows1) {
        if (err) return res.status(400).send(err);
        
        //총 인원
        var length = Object.keys(rows1).length;
        console.log(length);
        //내 랭킹 어떻게든 찾기

        db.get().query(querySelectHistories3, [userId, targetTime], function (err, rows2) {
            if (err) return res.status(400).send(err);
            return res.status(200).send(rows2);
        });

        
    });
});



router.get('/loadRank', isAuthenticated, function (req, res, next) {
    var userId = req.query.userId;
    var nowDate = moment().tz("Asia/Seoul");


    var selectMonthlyTotal = "SELECT SUM(term) AS total, " +
                                    "COUNT(term) AS count_term, " +
                                    "(SELECT today_goal FROM user_goals WHERE user_id = ? ORDER BY reg_time DESC LIMIT 1) AS goal FROM histories " +
                                    "WHERE user_id = ? AND " +
                                    "date(end_point) >= date(subdate(now(), INTERVAL 30 DAY)) AND " +
                                    "date(end_point) <= date(now())";
    //startDate, endDate 불러오기
    var selectStartEndDate = "(SELECT MIN(end_point) AS startDate, MAX(end_point) AS endDate FROM histories " 
                                +"WHERE user_id = ? AND end_point BETWEEN DATE_ADD(NOW(),INTERVAL -1 MONTH ) AND NOW() LIMIT 1)";
    
    db.get().query(selectMonthlyTotal, [userId, userId], function (err, rows1) {
        if (err) return res.status(400).send(err);
        db.get().query(selectStartEndDate, [userId, userId], function (err, rows2) {
            if (err) return res.status(400).send(err);
            
            var duration = moment.duration(moment(rows2[0].endDate).diff(rows2[0].startDate));
            
            var avgT = rows1[0].total / duration._data.days;
            var avgAR = rows1[0].total / rows1[0].goal;
            var avgCC = rows1[0].total / rows1[0].count_term;
            
            var result = {
                rank: loadRank(avgT, avgAR, avgCC),
                startDate: (rows2[0].startDate) ? rows2[0].startDate : nowDate,
                endDate: (rows2[0].endDate) ? rows2[0].endDate : nowDate
            }

            return res.status(200).send(result);
        });
    
    });

});

//기획이 먼저 필요하다
//현재 테이블로 해결 가능.
//1. 내 랭킹, 총 유저, 평균 공부시간
router.get('/loadRanking', isAuthenticated, function (req, res, next) {
    var result;
    //내 등수 
    var querySelectRanking = "SELECT COUNT(*)+1 AS ranking FROM statistics WHERE exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?)" +
                            " AND today_total > (SELECT SUM(today_total) FROM statistics WHERE user_id = ?)";
    //총 유저 수
    var querySelectTotal = "SELECT COUNT(*) AS total_user FROM statistics WHERE exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?)";
    //유저 평균
    var querySelectRankingAll = "SELECT subject_id, study_id, SUM(today_total) AS today_total FROM statistics WHERE exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?) GROUP BY subject_id, study_id";
    var querySelectSubject = "SELECT title FROM subjects WHERE exam_address = (SELECT exam_address FROM user_settings WHERE user_id = ?)";

    db.get().query(querySelectRanking, [req.query.userId, req.query.userId, req.query.userId], function (err, rows1) {
        if (err) return res.status(400).send(err);
        db.get().query(querySelectTotal, req.query.userId, function (err, rows2) {
            if (err) return res.status(400).send(err);
            db.get().query(querySelectRankingAll, req.query.userId, function (err, rows3) {
                if (err) return res.status(400).send(err);
                db.get().query(querySelectSubject, req.query.userId, function (err, rows4) {
                    if (err) return res.status(400).send(err);
                    //result = rows1[0];
                    console.log(rows1[0]);
                    console.log(rows2);           
                    console.log(rows3);
                    //console.log(rows4);
                    
                    
                    var names = [],
                        totals = [];
                    for (var i = 0; i < rows4.length; i++) {
                        names.push(rows4[i].title);
                    }
                    
                    for (var i = 0; i < rows3.length; i++) {
                        var terms = [0, 0, 0, 0];
                        /*
                        for (var j = 0; j < rows2.length; j++) {
                            if (subjectIdsArray[i] == rows4[j].subject_id) {
                                terms[rows4[j].study_id] += rows4[j].today_total;
                            }
                        }*/
                        //console.log(rows3[i].study_id);
                        if(rows3[i].study_id != undefined) {
                            terms[rows3[i].study_id] = rows3[i].today_total;
                            totals.push(terms);

                        }
                        //var id = rows3[i].study_id;
                    }

                    var subject = {
                        totals: totals,
                        names: names
                    }
                    return subject;

                    
                    result = {
                        //퍼센트 랭킹(서비스 규모 커지면 도입)
                        //ranking: rows1[0].ranking / rows2[0].total_user,
                        ranking: rows1[0].ranking,
                        totalUser: rows2[0].total_user,
                        avgT : rows2[0].total_time/rows2[0].total_user
                    }
                    return res.status(200).send(result);
             
                });
            });
        });
    });
});

//1일치 정보 Timeline 불러오기
//req: targetTime, userId
router.get('/timeline', isAuthenticated, function (req, res, next) {
    var targetTime = req.query.targetTime;
    var userId = req.query.userId;
    
    var querySelectHistories = "SELECT exam_address, subject_id, study_id, start_point, end_point, term FROM histories"
                                +" WHERE user_id = ? AND start_point >= ?";
    
    db.get().query(querySelectHistories, [userId, targetTime], function (err, rows) {
        if (err) return res.status(400).send(err);
        
        return res.status(200).send(rows);
    });

});



module.exports = router;
