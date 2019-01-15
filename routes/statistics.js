var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');
var Promise = require('promise');

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
    if (total >= 10 * 3600) {
        return 10;
    } else if (total >= 8 * 3600) {
        return 9;
    } else if (total >= 6 * 3600) {
        return 8;
    } else if (total >= 5 > 3600) {
        return 7;
    } else if (total >= 3 * 3600) {
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
        return 4;
    }
}

function getContinuousConcentrationScore(cc) {
    if (cc >= 1.0 * 3600) {
        return 10;
    } else if (cc >= 0.8 * 3600) {
        return 9;
    } else if (cc >= 0.6 * 3600) {
        return 8;
    } else if (cc >= 0.4 * 3600) {
        return 7;
    } else if (cc >= 0.2 * 3600) {
        return 6;
    } else if (cc >= 0.1 * 3600) {
        return 5;
    } else {
        return 4;
    }
}

function getRank(score) {
    if (score >= 24) {
        return "A+";
    } else if (score >= 21) {
        return "A";
    } else if (score >= 20) {
        return "B+";
    } else if (score >= 18) {
        return "B";
    } else if (score >= 16) {
        return "C+";
    } else if (score >= 14) {
        return "C";
    } else {
        return "F";
    }
}
//NEW
//REQ: targetTime, userId
router.get('/loadDayStat', isAuthenticated, function (req, res, next) {
    var targetTime = req.query.targetTime;
    var userId = req.query.userId;
    var rows1, rows2, rows3;
    var ranking, subjectRanking;
    var goal;
    var userSettings;
    //기존쿼리 3개
    getUserSetting(userId).then(function (data) {
            userSettings = data;
            return loadDayStatQuery1(targetTime, userId)
        })
        .then(function (data) {
            rows1 = data;
            console.log(userSettings[0]);
            return loadDayStatQuery2(targetTime, userId)
        })
        .then(function (data) {
            rows2 = data;
            return loadDayStatQuery3(userSettings[0].subject_ids)
        })
        .then(function (data) {
            rows3 = data;
            return getMyRanking(targetTime, userId)
        }).then(function (data) {
            ranking = data;
            return getMyGoals(targetTime, userId)
        }).then(function (data) {
            goal = data;
        })
        .then(() => {
            //#1. subjects
            //subjectId
            var subjects = [];
            var subjectIds = userSettings[0].subject_ids.split(",");
            var subjectColors = userSettings[0].subject_colors.split(",");


            //#1.1. subjects.totals
            var totals = [];
            for (var i = 0; i < subjectIds.length; i++) {
                var terms = [0, 0, 0, 0];
                for (var j = 0; j < rows2.length; j++) {
                    if (subjectIds[i] == rows2[j].subject_id) {
                        terms[rows2[j].study_id] += rows2[j].term;
                    }
                }
                totals.push(terms);
            }

            // #1.2. subjectGoals
            //996:10800,997:10800,998:14400 -> [996:10800, 997:10800, 998:14400]
            if (goal[0].subject_goals == undefined) {
                var subjectGoals = null;

            } else {
                var subjectGoals = goal[0].subject_goals.split(",");
                //[996:10800, 997:10800, 998:14400] -> [996, 10800 / 997, 10800 /998, 14400]
                var subjectGoals2 = [];
                for (var i = 0; i < subjectGoals.length; i++) {
                    subjectGoals2[i] = subjectGoals[i].split(":");
                }
            }

            for (var i = 0; i < subjectIds.length; i++) {
                var subjectGoal;
                //#1.2. subjects.goal
                //(같은 subject_id로 등록된 goal이 있으면 넣고, 없으면 0)
                if (subjectGoals == null) {
                    subjectGoal = 0;
                } else {
                    for (var j = 0; j < subjectGoals2.length; j++) {
                        if (subjectIds[i] == subjectGoals2[j][0]) {
                            subjectGoal = subjectGoals2[j][1];
                            break;
                        } else {
                            subjectGoal = 0;
                        }
                    }
                }

                var subject = {
                    id: subjectIds[i],
                    name: rows3[i].title,
                    color: subjectColors[i],
                    totals: totals[i],
                    goal: subjectGoal,
                    ranking: 1,
                    averageTime: 0,
                    highestTime: 0
                }
                subjects.push(subject);
            }




            //#2. loadDayStat
            console.log(rows1.total);

            var total = rows1.total == null ? 0 : rows1.total;
            var todayGoal = goal[0].today_goal == null ? 3600 : goal[0].today_goal;
            var termCount = rows1.term_count == null ? 0 : rows1.term_count;
            console.log(total);
            console.log(goal[0].today_goal);


            var achievementRate = (rows1.total == null) ? 0 : (total / goal[0].today_goal) * 100;
            var continuousConcentration = termCount == 0 ? 0 : parseInt(total / termCount);
            console.log(total);
            console.log(goal[0].today_goal);


            var loadDayStatResult = {
                total: total,
                goal: todayGoal,
                achievementRate: achievementRate,
                continuousConcentration: continuousConcentration,
                averageTime: ranking.averageTime,
                highestTime: ranking.highestTime,
                ranking: ranking.ranking,
                subjects: subjects
            }
            res.status(200).send(loadDayStatResult);

        }).catch(function (err) {
            console.log(err);
            return res.status(400).send(err);
        });
});
    //기존 쿼리1
    function getUserSetting (userId) {
        return new Promise(function (resolved, rejected) {
            var querySelectHistories = "SELECT subject_ids, subject_colors FROM user_settings " +
                                        "WHERE user_id = ?"
            db.get().query(querySelectHistories, [userId], function (err, rows) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                resolved(rows);
                console.log(rows);

                //return rows1;
            });
        });
    }
    function loadDayStatQuery1 (targetTime, userId) {
        return new Promise(function(resolved, rejected) {
            var querySelectHistories = "SELECT SUM(term) AS total, " +
                " COUNT(term) term_count FROM histories WHERE user_id = ?" +
                "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) AND DATE(end_point) = ?";
            db.get().query(querySelectHistories, [userId, userId, targetTime], function (err, rows1) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                resolved(rows1[0]);
                console.log(rows1[0]);
                
            });
        });
    }
    //기존 쿼리2
    function loadDayStatQuery2(targetTime, userId) {
        return new Promise(function (resolved, rejected) {
            var querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?" +
                " AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)" +
                " AND DATE(h.end_point) = ? ORDER BY h.subject_id, h.study_id";
            db.get().query(querySelectHistories2, [userId, userId, targetTime], function (err, rows2) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                //console.log(rows2);
                
                resolved(rows2);

            });
        });
    }

    //기존 쿼리3
    function loadDayStatQuery3(subjectIds) {
        return new Promise(function (resolved, rejected) {
            if(subjectIds == undefined) {
                resolved(null);
            }
            var querySelectSubjects = "SELECT title FROM subjects WHERE id IN (" + subjectIds + ")";
            db.get().query(querySelectSubjects, function (err, rows3) {  
                if (err) rejected(Error(err))
                //console.log(rows3);
                
                //성공한 경우 인자값을 넘긴다.
                resolved(rows3);

            });
        });
    }

    //ranking, totalUser, highest, avg
    function getMyRanking(targetTime, userId) {
        return new Promise(function (resolved, rejected) {
        
            var query = "SELECT user_id AS userId, SUM(term) AS total " +
                "FROM histories " +
                "WHERE DATE(start_point) = ? " +
                "GROUP BY user_id " +
                "HAVING user_id IN " +
                "(SELECT id FROM user_accounts) " +
                "ORDER BY total DESC";

            db.get().query(query, targetTime, function (err, rows) {
                if (err) rejected(Error(err));
                
                if(rows.length == 0){
                    var rankingResult = {
                        ranking: 1,
                        highestTime: 0,
                        averageTime: 0
                    }
                    resolved(rankingResult);
                } else {
                    //나의 랭킹을 찾기전 미리 꼴등으로 설정해놓는다.
                    var ranking = rows.length;
                
                    //나의 공부시간 등수를 찾는다. (DESC 정렬이기에 바로 가능)
                    for (var i in rows) {
                        if (rows[i].userId == userId) {
                            break;
                        }
                    }
                    console.log(i);
                    ranking = parseInt(i)+1;

                    //총합 계산
                    var totalTerm = 0;
                    for(var i in rows) {
                        //console.log(rows[i]);
                        totalTerm += rows[i].total;
                    }

                    //1등, 평균 계산
                    var highestTime = rows[0].total;
                    var averageTime = parseInt(totalTerm / rows.length);
                    var rankingResult = {
                        ranking: ranking,
                        totalUser: rows.length,
                        highestTime: highestTime,
                        averageTime: averageTime
                    }
                    resolved(rankingResult);
                }
            });
        });
    }
    //today_goal, subject_goals
    function getMyGoals(targetTime, userId) {
        return new Promise(function (resolved, rejected) {
            var tomorrowTime = moment(targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");

            var querySelectSubjects = "SELECT today_goal, subject_goals FROM user_goals " 
                                        + "WHERE reg_time < ? AND user_id = ? " 
                                        + "ORDER BY id DESC LIMIT 1";
            db.get().query(querySelectSubjects, [tomorrowTime, userId], function (err, rows) {
                if (err) rejected(Error(err))
                //console.log(rows);

                //성공한 경우 인자값을 넘긴다.
                resolved(rows);

            });
        });
    }

    //ranking, highest, avg
    function getSubjectRanking(targetTime, userId, subjectId) {
        return new Promise(function (resolved, rejected) {

            var query = "SELECT user_id AS userId, SUM(term) AS total " +
                "FROM histories " +
                "WHERE DATE(start_point) = ? " +
                "AND subject_id = ?"
                "GROUP BY user_id " +
                "HAVING user_id IN " +
                "(SELECT id FROM user_accounts) " +
                "ORDER BY total DESC";

            db.get().query(query, [targetTime, subjectId], function (err, rows) {
                if (err) rejected(Error(err));


                //나의 랭킹을 찾기전 미리 꼴등으로 설정해놓는다.
                //만약 rows에 내 기록이 없는 경우에는 꼴지로 해야되니까 미리 해놓음
                var ranking = rows.length;
                var totalTerm = 0;
                //나의 공부시간 등수를 찾는다. (DESC 정렬이기에 바로 가능)
                for (var i in rows) {
                    if (rows[i].userId == userId) {
                        ranking = parseInt(i) + 1;
                        break;
                    }
                }

                //총합 계산
                for (var i in rows) {
                    //console.log(rows[i]);
                    totalTerm += rows[i].total;
                }

                var highestTime = rows[0].total;
                var averageTime = totalTerm / rows.length;
                var rankingResult = {
                    ranking: ranking,
                    highestTime: highestTime,
                    averageTime: averageTime
                }

                resolved(rankingResult);
            });
        });
    }


//REQ: userId
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
            var avgAR = rows1[0].total / rows1[0].goal * 100;
            var avgCC = rows1[0].total / rows1[0].count_term;
            console.log(rows1[0]);
            
            console.log(avgT);
            console.log(avgAR);
            console.log(avgCC);
            
            
            var result = {
                rank: loadRank(avgT, avgAR, avgCC),
                startDate: (rows2[0].startDate) ? rows2[0].startDate : nowDate,
                endDate: (rows2[0].endDate) ? rows2[0].endDate : nowDate
            }

            return res.status(200).send(result);
        });
    
    });

});

//1일치 정보 Raw Data 불러오기
//req: userId, year, month, date
//지금까지 get은 req.query로 전송하고 있었는데 req.params가 편함?
//아뇨 딱히 그런건 아닌데, 이 리퀘스트는 날짜 조회하는거니까 구조상 이렇게쓰는게 더 편하죠.
router.get('/getRawData/:userId/:year/:month/:date', isAuthenticated, function (req, res, next) {
    var userId = req.params.userId;
    var year = req.params.year;
    var month = req.params.month;
    var date = req.params.date;


    //String typed targetTime 만들기
    getStringDate(year, month, date)
    .then(function(targetTime) {
        //DB query
        return getRawData(userId, targetTime);
    })
    .then(function(data) {
        //쿼리 결과 값에서 startPoint와 endPoint를 Timestamp로 변환하자
        for (var i in data) {
            data[i].startPoint = getTimeStamp(data[i].startPoint);
            data[i].endPoint = getTimeStamp(data[i].endPoint);
        }

        res.status(200).send(data);
    })
    .catch(function(err) {
        console.log(err);
        return res.status(400).send(err);
    });

});


    function getStringDate(year, month, date) {
        return new Promise(function (resolved, rejected) {
            var result = moment().format();
            result = moment().set('year', year);
            result = moment().set('month', month);
            result = moment().set('date', date);
            result = moment().startOf('date');

            resolved(result.format('YYYY-MM-DD'));
        });
    }

    function getTimeStamp(from) {
        return moment(from).valueOf();
    }

    //하루만
    function getRawData(userId, targetTime) {
        return new Promise(function (resolved, rejected) {
            //console.log(targetTime);
            //var targetTimeAfter = moment(targetTIme).add(1, 'days');
            //offsetTime = moment(offsetTime).subtract(1, 'days');
            
            // start_point = ?: 해당 날짜에 해당하는 데이터
            var querySelectHistories = "SELECT id, " +
                                        "exam_address AS examAddress, " +
                                        "subject_id AS subjectId, " +
                                        "study_id AS studyId, " +
                                        "start_point AS startPoint, " +
                                        "end_point AS endPoint, " +
                                        "term " +
                                        "FROM histories " +
                                        "WHERE user_id = ? AND DATE(start_point) = ? " +
                                        "ORDER BY id DESC";
            
            db.get().query(querySelectHistories, [userId, targetTime], function (err, rows) {
                if (err) rejected(Error(err));
                if (rows.length == 0) rejected(Error('No Data'));
                
                return resolved(rows);
            });
        });
    }

//REQ: targetTime
router.get('/getAvergeGoal', isAuthenticated, function (req, res, next) {
    var userId = req.query.userId;

    //String typed targetTime 만들기

});


    //해당 날짜의 최근 3일 공부한 user들
    function getRecentStudyUsers(targetTime) {
        return new Promise(function (resolved, rejected) {
            var targetTimeSubtract2 = moment(targetTIme).subtract(2, 'days');
            //offsetTime = moment(offsetTime).subtract(1, 'days');
            var querySelectHistories = "SELECT (distinct) user_id" + 
                "FROM histories " +
                "WHERE end_point >= ? " +
                "AND end_point <= ?";
            
            db.get().query(querySelectHistories, [targetTimeSubtract2, targetTime], function (err, rows) {
                if (err) rejected(Error(err));
                if (rows.length == 0) rejected(Error('No Data'));
                console.log(this.sql);

                return resolved(rows);
            });
        });
    }

    //userIds에 해당하는 goal의 평균
    function getAverageGoal(userIds) {
        return new Promise(function (resolved, rejected) {
            var querySelectGoals = "SELECT today_goal " +
                "FROM user_goals " +
                "GROUP BY user_id" +
                "WHERE user_id IN ("+userIds+") ";
                

            db.get().query(querySelectgoals, function (err, rows) {
                if (err) rejected(Error(err));
                if (rows.length == 0) rejected(Error('No Data'));
                console.log(this.sql);

                return resolved(rows);
            });
        });
    }


module.exports = router;

function selectSubjectIds(userId) {
    return new Promise(function (resolved, rejected) {
        var querySelectHistories = "SELECT subject_ids FROM user_settings WHERE user_id = ?";
        db.get().query(querySelectHistories, userId, function (err, rows) {
            if (err) rejected(Error(err))
            //성공한 경우 인자값을 넘긴다.
            resolved(rows);

        });
    });
}

function selectSubjectTerm(targetTime, userId) {
    return new Promise(function (resolved, rejected) {
        var querySelectHistories = "SELECT h.subject_id, SUM(h.term) AS term FROM histories AS h JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?" +
            " AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)" +
            " AND DATE(h.end_point) = ? GROUP BY h.subject_id ORDER BY h.subject_id";
        db.get().query(querySelectHistories, [userId, userId, targetTime], function (err, rows) {
            if (err) rejected(Error(err))
            //성공한 경우 인자값을 넘긴다.

            resolved(rows);
            //return rows2;
        });
    });
}

function selectSubjectGoals(targetTime, userId) {
    return new Promise(function (resolved, rejected) {
        var tomorrowTime = moment(targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");
        var querySelectHistories = "SELECT subject_goals FROM user_goals WHERE user_id = ? AND DATE(reg_time) < ? ORDER BY id DESC LIMIT 1"
        db.get().query(querySelectHistories, [userId, tomorrowTime], function (err, rows) {
            if (err) rejected(Error(err))

            //성공한 경우 인자값을 넘긴다.
            resolved(rows);
        });
    });
}

function selectSubjectAvg(targetTime, subjectId) {
    return new Promise(function (resolved, rejected) {

        var querySelectHistories = "SELECT user_id, SUM(term) as term FROM histories " +
            "WHERE DATE(end_point) = ? AND subject_id = ? " +
            "GROUP BY user_id"; +
        "ORDER BY term DESC";
        db.get().query(querySelectHistories, [targetTime, subjectId], function (err, rows) {
            if (err) rejected(Error(err));
            var rows
            //성공한 경우 인자값을 넘긴다.
            resolved(rows);
        });
    });
}
