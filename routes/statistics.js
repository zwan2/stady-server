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
    if (score >= 29) {
        return "A+";
    } else if (score >= 27) {
        return "A";
    } else if (score >= 24) {
        return "B+";
    } else if (score >= 21) {
        return "B";
    } else if (score >= 18) {
        return "C+";
    } else if (score >= 15) {
        return "C";
    } else {
        return "F";
    }
}


//1일치 정보(총공부시간,목표달성률,연속집중력) 불러오기
//req: targetTime, userId
router.get('/loadDayStat', isAuthenticated, function (req, res, next) {
    
    var tomorrowTime = moment(req.query.targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");
    
    //SELECT common
    var querySelectHistories = "SELECT SUM(term) AS total, (SELECT today_goal FROM user_goals WHERE reg_time < ? ORDER BY reg_time DESC LIMIT 1) AS goal,"
    +"(SELECT subject_ids FROM user_settings WHERE user_id = ?) AS subjectIds, COUNT(term) term_count FROM histories WHERE user_id = ?"
    + "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND end_point >= ?";
    
    //SELECT subject
    //약짬뽕(DB에서 h.term -> 서버 코드에서 합침)
    var querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?"
                                +" AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)"
                                +" AND h.end_point >= ? ORDER BY h.subject_id, h.study_id";
                                
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
                            terms[rows2[j].study_id] += rows2[j].term;
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
                
                //rank
                var avgT = total / 30;
                var avgAR = total / rows1[0].goal;
                var avgCC = total / termCount;
           
                var rank = loadRank(avgT, avgAR, avgCC);

                var loadDayStatResult = {
                    total: rows1[0].total == null ? 0 : rows1[0].total,
                    goal: rows1[0].goal == null ? 0 : rows1[0].goal,
                    achievementRate: rows1[0].total / rows1[0].goal * 100,
                    continuousConcentration: (continuousConcentration == null || continuousConcentration == "null") ? 1 : continuousConcentration,
                    subject: subject,
                    rank: rank
                }
                return res.status(200).send(loadDayStatResult);
                
            });
        });
    });
});

router.get('/loadRank', isAuthenticated, function (req, res, next) {

    var userId = req.query.userId;

    var selectMonthlyTotal = "SELECT SUM(term) AS total, COUNT(term) AS count_term, (SELECT today_goal FROM user_goals WHERE reg_time < ? ORDER BY reg_time DESC LIMIT 1) AS goal," 
                            "FROM histories WHERE user_id = ? AND date(end_point) >= date(subdate(now(), INTERVAL 30 DAY)) AND " +
                            "date(end_point) <= date(now())";

    db.get().query(selectMonthlyTotal, userId, function (err, rows) {
        if (err) return res.status(400).send(err);

        var avgT = rows[0].total/30;
        var avgAR = rows[0].total / goal;
        var avgCC = rows[0].total / count_term;
        
        

        return res.status(200).send(loadRank(avgT, avgAR, avgCC));
    });

});


module.exports = router;
