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
    if (total >= 9 * 3600) {
        return 10;
    } else if (total >= 7 * 3600) {
        return 8;
    } else if (total >= 5 * 3600) {
        return 6;
    } else if (total >= 4 > 3600) {
        return 5;
    } else if (total >= 2 * 3600) {
        return 3;
    } else if (total >= 1 * 3600) {
        return 2;
    } else {
        return 0;
    }
}

function getAchievementRateScore(ar) {
    if (ar >= 100) {
        return 10;
    } else if (ar >= 95) {
        return 9;
    } else if (ar >= 90) {
        return 8;
    } else if (ar >= 80) {
        return 7;
    } else if (ar >= 70) {
        return 6;
    } else if (ar >= 40) {
        return 5;
    } else {
        return 4;
    }
}

function getContinuousConcentrationScore(cc) {
    if (cc >= 1.6 * 3600) {
        return 10;
    } else if (cc >= 1.4 * 3600) {
        return 9.5;
    } else if (cc >= 1.2 * 3600) {
        return 9;
    } else if (cc >= 1.0 * 3600) {
        return 8.5;
    } else if (cc >= 0.8 * 3600) {
        return 8;
    } else if (cc >= 0.4 * 3600) {
        return 7;
    } else {
        return 6;
    }
}

function getRank(score) {
    if (score >= 26) {
        return "A+";
    } else if (score >= 24) {
        return "A";
    } else if (score >= 22) {
        return "B+";
    } else if (score >= 20) {
        return "B";
    } else if (score >= 18) {
        return "C+";
    } else if (score >= 16) {
        return "C";
    } else {
        return "F";
    }
}

//subjectIds -> subjectTitle
function getSubjectTitle(subjectIds) {
    return new Promise(function (resolved, rejected) {
        if (subjectIds == undefined) {
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

// //REQ: userId, year, month, date
// //통계 페이지 데이터 전부 불러오기(유저 아이디별, 날짜별)
// router.get('/ES6_getStatistics/:userId/:year/:month/:date', isAuthenticated, function (req, res, next) {

//     const userId = req.params.userId;
//     const year = req.params.year;
//     const month = req.params.month;
//     const date = req.params.date;

  

//     const targetTime = getStringDate(year, month, date);

//     const getStatistics = async (userId=0, targetTime='2018-01-01') => {
//         try {
//             const userSettings = _getUserSetting(userId);
//             const subjectTitles = getSubjectTitle(userSettings.subject_ids=0);

//             let total = await _getTotal(userId, targetTime);
//             let pauseCount = await _getPauseCount(userId, targetTime);
//             const totalBySubjectAndStudy = await _getTotalBySubjectAndStudy(userId, targetTime);
//             const ranking = await _getMyranking(userId, targetTime);
//             const goal = await _getMyGoals(userId, targetTime);
//             const averageGoal = await _getAverageGoalTemp(targetTime);
//             const raws = await _getRawData(userId, targetTime);

//             //#1. subjects 객체 (graph)를 만드는 함수
//             function _userSettingsAndGoalToSubjects(userSettings, goal) {
//                 const subjectIds = userSettings.subject_ids.split(",");
//                 const subjectColors = userSettings.subject_colors.split(",");
//                 let subjects = [];
//                 let subjectGoal, subjectGoals, subjectGoals2 = [];
 
//                 //#1.1. subjects.totals
//                 let totals = [];
//                 for (let i = 0; i < subjectIds.length; i++) {
//                     let terms = [0, 0, 0, 0];
//                     for (let j = 0; j < totalBySubjectAndStudy.length; j++) {
//                         if (subjectIds[i] == totalBySubjectAndStudy[j].subject_id) {
//                             terms[totalBySubjectAndStudy[j].study_id] += totalBySubjectAndStudy[j].term;
//                         }
//                     }
//                     totals.push(terms);
//                 }

//                 // #1.2. subjectGoals
//                 //996:10800,997:10800,998:14400 -> [996:10800, 997:10800, 998:14400]
//                 if (goal.subject_goals == undefined) {
//                     subjectGoals = null;

//                 } else {
//                     subjectGoals = goal.subject_goals.split(",");
//                     //[996:10800, 997:10800, 998:14400] -> [996, 10800 / 997, 10800 /998, 14400]
//                     for (let i = 0; i < subjectGoals.length; i++) {
//                         subjectGoals2[i] = subjectGoals[i].split(":");
//                     }
//                 }

//                 for (let i = 0; i < subjectIds.length; i++) {

//                     //#1.2. subjects.goal
//                     //(같은 subject_id로 등록된 goal이 있으면 넣고, 없으면 0)
//                     if (subjectGoals == null) {
//                         subjectGoal = 0;
//                     } else {
//                         for (let j = 0; j < subjectGoals2.length; j++) {
//                             if (subjectIds[i] == subjectGoals2[j][0]) {
//                                 subjectGoal = subjectGoals2[j][1];
//                                 break;
//                             } else {
//                                 subjectGoal = 0;
//                             }
//                         }
//                     }

//                     let subject = {
//                         id: subjectIds[i],
//                         name: subjectTitles[i].title,
//                         color: subjectColors[i],
//                         totals: totals[i],
//                         goal: subjectGoal,
//                         ranking: 1,
//                         averageTime: 0,
//                         highestTime: 0
//                     }
//                     subjects.push(subject);
//                 }
//                 return subjects;
//             }
//             const subjects = await _userSettingsAndGoalToSubjects(userSettings, goal);
     
//             //#2.1. 나와의비교
//             if (total == null) total = 0;
//             if (pauseCount == null) pauseCount = 0;
//             const todayGoal = goal.today_goal == null ? 3600 : goal.today_goal;
//             const achievementRate = (total == null) ? 0 : (total / goal.today_goal) * 100;
//             const continuousConcentration = pauseCount == 0 ? 0 : parseInt(total / pauseCount);

//             //#2.2.DailyReport
//             const startTime = raws == null ? getTimeStamp(raws[raws.length - 1].startPoint) : 0;
//             const endTime = raws == null ? getTimeStamp(raws[0].endPoint) : 0;
//             const rankForDay = getRankForDay(total, pauseCount, todayGoal);

//             const loadDayStatResult = {
//                 //그래프
//                 subjects: subjects,

//                 //나와의 비교
//                 total: total,
//                 goal: todayGoal,
//                 achievementRate: achievementRate,
//                 continuousConcentration: continuousConcentration,

//                 //타인과의 비교
//                 ranking: ranking.ranking,
//                 totalUser: ranking.totalUser,
//                 avaerageGoal: averageGoal,
//                 highestTime: ranking.highestTime,
//                 averageTime: ranking.averageTime,

//                 //DailyReport
//                 pauseCount: pauseCount,
//                 percentile: ranking.ranking / ranking.totalUser,
//                 startTime: startTime,
//                 endTime: endTime,
//                 rank: rankForDay,
//                 raws: raws
//             }
//             res.status(200).send(loadDayStatResult);

//         } catch(err) {
//             console.log(err);
//             return res.status(400).send(err);
//         }
        
       
//     }

//     if(userId != null && targetTime != null) {
//         getStatistics(userId, targetTime);
//     } else {
//         console.log("no params!");
//         return res.sendStatus(400);
//     }

// }); 



function  _getUserSetting(userId) {
    return new Promise(function (resolved, rejected) {
        let querySelectHistories = "SELECT subject_ids, subject_colors " +
            "FROM user_settings " +
            "WHERE user_id = ?"
        db.get().query(querySelectHistories, [userId], function (err, rows) {
            if (err) rejected(Error(err))

            //성공한 경우 인자값을 넘긴다.
            resolved(rows[0]);
            //console.log(rows);

            //return rows1;
        });
    });
}

function  _getTotal(userId, targetTime) {
    let querySelectHistories = "SELECT SUM(term) AS total " +
        "FROM histories WHERE user_id = ? " +
        "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) " +
        "AND DATE(end_point) = ?";
    console.log(userId);

    db.get().query(querySelectHistories, [userId, userId, targetTime], (row) => {
        try {
            console.log(row);
            return row[0].total;
        } catch (err) {


            return err;
        }
    });
}

function  _getPauseCount(userId, targetTime) {
    return new Promise(function (resolved, rejected) {
        let termLimit = 60;
        let querySelectHistories = "SELECT COUNT(term) AS pauseCount FROM histories " +
            "WHERE term > ? " +
            "AND user_id = ? " +
            "AND DATE(end_point) = ? "
        "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)";

        db.get().query(querySelectHistories, [termLimit, userId, userId, targetTime], function (err, row) {
            if (err) rejected(Error(err))

            //성공한 경우 인자값을 넘긴다.
            resolved(row[0].pauseCount);
            //console.log("a:"+row[0].pauseCount);

        });
    });
}

//과목.공부방법별 공부시간 
function  _getTotalBySubjectAndStudy(userId, targetTime) {
    return new Promise(function (resolved, rejected) {
        let querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h " +
            "JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?" +
            " AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)" +
            " AND DATE(h.end_point) = ? ORDER BY h.subject_id, h.study_id";
        db.get().query(querySelectHistories2, [userId, userId, targetTime], function (err, rows2) {
            if (err) rejected(Error(err))

            //성공한 경우 인자값을 넘긴다.
            resolved(rows2);

        });
    });
}

//ranking, totalUser, highest, avg
function  _getMyRanking(userId, targetTime) {
    return new Promise(function (resolved, rejected) {

        let query = "SELECT user_id AS userId, SUM(term) AS total " +
            "FROM histories " +
            "WHERE DATE(start_point) = ? " +
            "GROUP BY user_id " +
            "HAVING user_id IN " +
            "(SELECT id FROM user_accounts) " +
            "ORDER BY total DESC";

        db.get().query(query, targetTime, function (err, rows) {
            if (err) rejected(Error(err));
            //console.log(rows);

            if (rows.length == 0) {
                let rankingResult = {
                    ranking: 1,
                    highestTime: 0,
                    averageTime: 0
                }
                resolved(rankingResult);
            } else {
                //나의 랭킹을 찾기전 미리 꼴등으로 설정해놓는다.
                let ranking = rows.length;

                //나의 공부시간 등수를 찾는다. (DESC 정렬이기에 바로 가능)
                for (var i in rows) {
                    if (rows[i].userId == userId) {
                        break;
                    }
                }
                console.log(i);
                ranking = parseInt(i) + 1;

                //총합 계산
                let totalTerm = 0;
                for (var i in rows) {
                    //console.log(rows[i]);
                    totalTerm += rows[i].total;
                }

                //1등, 평균 계산
                let highestTime = rows[0].total;
                let averageTime = parseInt(totalTerm / rows.length);
                let rankingResult = {
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
function  _getMyGoals(userId, targetTime) {
    return new Promise(function (resolved, rejected) {
        let tomorrowTime = moment(targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");

        let querySelectSubjects = "SELECT today_goal, subject_goals FROM user_goals "
            + "WHERE reg_time < ? AND user_id = ? "
            + "ORDER BY id DESC LIMIT 1";
        db.get().query(querySelectSubjects, [tomorrowTime, userId], function (err, rows) {
            if (err) rejected(Error(err))
            //console.log(rows);

            //성공한 경우 인자값을 넘긴다.
            resolved(rows[0]);

        });
    });
}

function  _getAverageGoalTemp(targetTime) {
    return new Promise(function (resolved, rejected) {
        let querySelectGoals = "SELECT AVG(today_goal) AS averageGoal " +
            "FROM user_goals " +
            "WHERE reg_time <= ?";


        db.get().query(querySelectGoals, targetTime, function (err, rows) {
            if (err) rejected(Error(err));

            if (rows.length == 0) rejected(Error('No Data'));
            //console.log(this.sql);
            let averageGoal = parseInt(rows[0].averageGoal);
            return resolved(averageGoal);
        });
    });
}


//REQ: userId, year, month, date
//통계 페이지 데이터 전부 불러오기(유저 아이디별, 날짜별)
router.get('/getStatistics/:userId/:year/:month/:date', isAuthenticated, function (req, res, next) {

    let userId = req.params.userId;
    let year = req.params.year;
    let month = req.params.month;
    let date = req.params.date;

    let targetTime;
    let userSettings;
    let total;
    let pauseCount;
    let totalBySubjectAndStudy;
    let subjectTitles;
    let ranking;
    let goal;
    let averageGoal;
    let raws;
    
   
    //String typed targetTime 만들기
    getStringDate(year, month, date)
        .then(function (data) {
            targetTime = data;
   
            return getUserSetting(userId)
        })
        .then(function (data) {
            userSettings = data;
         
            return getTotal(userId, targetTime)
        })
        .then(function (data) {
            total = data;
            return getPauseCount(userId, targetTime)
        })
        .then(function (data) {
            pauseCount = data;
            return getTotalBySubjectAndStudy(userId, targetTime)
        })
        .then(function (data) {
            totalBySubjectAndStudy = data;
            return getSubjectTitle(userSettings.subject_ids)
        })
        .then(function (data) {
            subjectTitles = data;
            return getMyRanking(userId, targetTime)
        }).then(function (data) {
            ranking = data;
            return getMyGoals(userId, targetTime)
        }).then(function (data) {
            goal = data;
            return getAverageGoalTemp(targetTime);
        }).then(function (data) {
            averageGoal = data;
            return getRawData(userId, targetTime);
        }).then(function(data) {
            //쿼리 결과 값에서 startPoint와 endPoint를 Timestamp 변환하자
            for (var i in data) {
                data[i].startPoint = getTimeStamp(data[i].startPoint);
                data[i].endPoint = getTimeStamp(data[i].endPoint);
            }
            raws = data;
        })
        .then(() => {

            //#1. subjects 객체 (graph)를 만드는 함수
            function userSettingsAndGoalToSubjects(userSettings, goal) {
                let subjects = [];
                let subjectIds = userSettings.subject_ids.split(",");
                let subjectColors = userSettings.subject_colors.split(",");
                let subjectGoal, subjectGoals, subjectGoals2 = [];
                //#1.1. subjects.totals
                let totals = [];
                for (let i = 0; i < subjectIds.length; i++) {
                    let terms = [0, 0, 0, 0];
                    for (let j = 0; j < totalBySubjectAndStudy.length; j++) {
                        if (subjectIds[i] == totalBySubjectAndStudy[j].subject_id) {
                            terms[totalBySubjectAndStudy[j].study_id] += totalBySubjectAndStudy[j].term;
                        }
                    }
                    totals.push(terms);
                }

                // #1.2. subjectGoals
                //996:10800,997:10800,998:14400 -> [996:10800, 997:10800, 998:14400]
                if (goal.subject_goals == undefined) {
                    subjectGoals = null;

                } else {
                    subjectGoals = goal.subject_goals.split(",");
                    //[996:10800, 997:10800, 998:14400] -> [996, 10800 / 997, 10800 /998, 14400]
                    for (let i = 0; i < subjectGoals.length; i++) {
                        subjectGoals2[i] = subjectGoals[i].split(":");
                    }
                }
                for (let i = 0; i < subjectIds.length; i++) {

                    //#1.2. subjects.goal
                    //(같은 subject_id로 등록된 goal이 있으면 넣고, 없으면 0)
                    if (subjectGoals == null) {
                        subjectGoal = 0;
                    } else {
                        for (let j = 0; j < subjectGoals2.length; j++) {
                            if (subjectIds[i] == subjectGoals2[j][0]) {
                                subjectGoal = subjectGoals2[j][1];
                                break;
                            } else {
                                subjectGoal = 0;
                            }
                        }
                    }

                    let subject = {
                        id: subjectIds[i],
                        name: subjectTitles[i].title,
                        color: subjectColors[i],
                        totals: totals[i],
                        goal: subjectGoal,
                        ranking: 1,
                        averageTime: 0,
                        highestTime: 0
                    }
                    subjects.push(subject);
                }
                return subjects;
            }
            let subjects = userSettingsAndGoalToSubjects(userSettings, goal);

            //#2.1. 나와의비교
            if (total == null) total = 0;
            if (pauseCount == null) pauseCount = 0;
            let todayGoal = goal.today_goal == null ? 3600 : goal.today_goal;
            let achievementRate = (total == null) ? 0 : (total / goal.today_goal) * 100;
            let continuousConcentration = pauseCount == 0 ? 0 : parseInt(total / pauseCount);

            //#2.2.DailyReport
            let startTime = raws == null ? getTimeStamp(raws[raws.length - 1].startPoint) : 0;
            let endTime = raws == null ? getTimeStamp(raws[0].endPoint) : 0;
            let rankForDay = getRankForDay(total, pauseCount, todayGoal);
            console.log(rankForDay);
            
            let loadDayStatResult = {
                //그래프
                subjects: subjects,

                //나와의 비교
                total: total,
                goal: todayGoal,
                achievementRate: achievementRate,
                continuousConcentration: continuousConcentration,

                //타인과의 비교
                ranking: ranking.ranking,
                totalUser: ranking.totalUser,
                averageGoal: averageGoal,
                highestTime: ranking.highestTime,
                averageTime: ranking.averageTime,

                //DailyReport
                pauseCount: pauseCount,
                percentile: ranking.ranking / ranking.totalUser,
                startTime: startTime,
                endTime: endTime,
                rank: rankForDay,
                raws: raws


            }
            //console.log(raws[0]);
            res.status(200).send(loadDayStatResult);

        }).catch(function (err) {
            console.log(err);
            return res.status(400).send(err);
        });
});
    //total, count, goal
    function getRankForDay(total, pauseCount, goal) {
        let avgT = total;
        let avgAR = total / goal * 100;
        let avgCC = total / pauseCount;
        let rank = loadRank(avgT, avgAR, avgCC);
        console.log(rank);
        
        if(rank == null) {
            return "F";
        } else {
            return rank;
        }
    }

    function getUserSetting(userId) {
        return new Promise(function (resolved, rejected) {
            let querySelectHistories = "SELECT subject_ids, subject_colors " +
                "FROM user_settings " +
                "WHERE user_id = ?"
            db.get().query(querySelectHistories, [userId], function (err, rows) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                resolved(rows[0]);
                //console.log(rows);

                //return rows1;
            });
        });
    }

    function getTotal(userId, targetTime) {
        return new Promise(function (resolved, rejected) {
            let querySelectHistories = "SELECT SUM(term) AS total " +
                "FROM histories WHERE user_id = ? " +
                "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) " +
                "AND DATE(end_point) = ?";
                console.log(userId);
                
            db.get().query(querySelectHistories, [userId, userId, targetTime], function (err, row) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                console.log(row[0]);
                resolved(row[0].total);
                

            });
        });
    }

    function getPauseCount(userId, targetTime) {
        return new Promise(function (resolved, rejected) {
            let termLimit = 60;
            let querySelectHistories = "SELECT COUNT(term) AS pauseCount FROM histories " +
                "WHERE term > ? " +
                "AND user_id = ? " +
                "AND DATE(end_point) = ? "
            "AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)";

            db.get().query(querySelectHistories, [termLimit, userId, userId, targetTime], function (err, row) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                resolved(row[0].pauseCount);
                //console.log("a:"+row[0].pauseCount);

            });
        });
    }

    //과목.공부방법별 공부시간 
    function getTotalBySubjectAndStudy(userId, targetTime) {
        return new Promise(function (resolved, rejected) {
            let querySelectHistories2 = "SELECT h.subject_id, h.study_id, h.term FROM histories AS h " +
                "JOIN subjects AS s WHERE h.subject_id = s.id AND h.user_id = ?" +
                " AND h.exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?)" +
                " AND DATE(h.end_point) = ? ORDER BY h.subject_id, h.study_id";
            db.get().query(querySelectHistories2, [userId, userId, targetTime], function (err, rows2) {
                if (err) rejected(Error(err))

                //성공한 경우 인자값을 넘긴다.
                resolved(rows2);

            });
        });
    }

    //ranking, totalUser, highest, avg
    function getMyRanking(userId, targetTime) {
        return new Promise(function (resolved, rejected) {

            let query = "SELECT user_id AS userId, SUM(term) AS total " +
                "FROM histories " +
                "WHERE DATE(start_point) = ? " +
                "GROUP BY user_id " +
                "HAVING user_id IN " +
                "(SELECT id FROM user_accounts) " +
                "ORDER BY total DESC";

            db.get().query(query, targetTime, function (err, rows) {
                if (err) rejected(Error(err));
                //console.log(rows);

                if (rows.length == 0) {
                    let rankingResult = {
                        ranking: 1,
                        highestTime: 0,
                        averageTime: 0
                    }
                    resolved(rankingResult);
                } else {
                    //나의 랭킹을 찾기전 미리 꼴등으로 설정해놓는다.
                    let ranking = rows.length;

                    //나의 공부시간 등수를 찾는다. (DESC 정렬이기에 바로 가능)
                    for (var i in rows) {
                        if (rows[i].userId == userId) {
                            break;
                        }
                    }
                    console.log(i);
                    ranking = parseInt(i) + 1;

                    //총합 계산
                    let totalTerm = 0;
                    for (var i in rows) {
                        //console.log(rows[i]);
                        totalTerm += rows[i].total;
                    }

                    //1등, 평균 계산
                    let highestTime = rows[0].total;
                    let averageTime = parseInt(totalTerm / rows.length);
                    let rankingResult = {
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
    function getMyGoals(userId, targetTime) {
        return new Promise(function (resolved, rejected) {
            let tomorrowTime = moment(targetTime, "YYYY-MM-DD").add(1, 'day').format("YYYY-MM-DD");

            let querySelectSubjects = "SELECT today_goal, subject_goals FROM user_goals "
                + "WHERE reg_time < ? AND user_id = ? "
                + "ORDER BY id DESC LIMIT 1";
            db.get().query(querySelectSubjects, [tomorrowTime, userId], function (err, rows) {
                if (err) rejected(Error(err))
                //console.log(rows);

                //성공한 경우 인자값을 넘긴다.
                resolved(rows[0]);

            });
        });
    }

    function getAverageGoalTemp(targetTime) {
        return new Promise(function (resolved, rejected) {
            let querySelectGoals = "SELECT AVG(today_goal) AS averageGoal " +
                "FROM user_goals " +
                "WHERE reg_time <= ?";


            db.get().query(querySelectGoals, targetTime, function (err, rows) {
                if (err) rejected(Error(err));

                if (rows.length == 0) rejected(Error('No Data'));
                //console.log(this.sql);
                let averageGoal = parseInt(rows[0].averageGoal);
                return resolved(averageGoal);
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
router.get('/getRawData/:userId/:year/:month/:date', isAuthenticated, function (req, res, next) {
    var userId = req.params.userId;
    var year = req.params.year;
    var month = req.params.month;
    var date = req.params.date;
  
    //String typed targetTime 만들기
    getStringDate(year, month, date)
    .then(function(targetTime) {
        //DB query
        console.log("a"+targetTime);
        
        return getRawData(userId, targetTime);
    })
    .then(function(data) {
        //쿼리 결과 값에서 startPoint와 endPoint를 Timestamp 변환하자
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
            
            var result = moment({
                year: year,
                month: month-1,
                date: date
            });
            //console.log(result);
            
            
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
                if (rows.length == 0) return resolved([]);
                console.log(this.sql);
                
                return resolved(rows);
            });
        });
    }












    
    //해당 날짜의 최근 3일 공부한 user들
    function getRecentStudyUsers(targetTime) {
        return new Promise(function (resolved, rejected) {
            var targetTimeSubtract2 = moment(targetTime).subtract(2, 'days');
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


router.get('/loadDayStat', isAuthenticated, function (req, res, next) {
    var targetTime = req.query.targetTime;
    var userId = req.query.userId;

    var total, pauseCount;
    var totalBySubjectAndStudy, subjectTitles;
    var ranking;
    var goal;
    var userSettings;
    var subjectIds, subjectColors;

    //기존쿼리 3개
    getUserSetting(userId).then(function (data) {
            userSettings = data;
            return getTotal(userId, targetTime)
        })
        .then(function (data) {
            total = data;
            return getPauseCount(userId, targetTime)
        })
        .then(function (data) {
            pauseCount = data;
            return getTotalBySubjectAndStudy(userId, targetTime)
        })
        .then(function (data) {
            totalBySubjectAndStudy = data;
            return getSubjectTitle(userSettings.subject_ids)
        })
        .then(function (data) {
            subjectTitles = data;
            return getMyRanking(userId, targetTime)
        }).then(function (data) {
            ranking = data;
            return getMyGoals(userId, targetTime)
        }).then(function (data) {
            goal = data;
            return getAverageGoalTemp(targetTime);
        }).then(function (data) {
            averageGoal = data;
        })
        .then(() => {
            //#1. subjects
            //subjectId, colors
            var subjects = [];
            subjectIds = userSettings.subject_ids.split(",");
            subjectColors = userSettings.subject_colors.split(",");


            //#1.1. subjects.totals
            var totals = [];
            for (var i = 0; i < subjectIds.length; i++) {
                var terms = [0, 0, 0, 0];
                for (var j = 0; j < totalBySubjectAndStudy.length; j++) {
                    if (subjectIds[i] == totalBySubjectAndStudy[j].subject_id) {
                        terms[totalBySubjectAndStudy[j].study_id] += totalBySubjectAndStudy[j].term;
                    }
                }
                totals.push(terms);
            }

            // #1.2. subjectGoals
            //996:10800,997:10800,998:14400 -> [996:10800, 997:10800, 998:14400]
            if (goal.subject_goals == undefined) {
                var subjectGoals = null;

            } else {
                var subjectGoals = goal.subject_goals.split(",");
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
                    name: subjectTitles[i].title,
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
            var todayGoal = goal.today_goal == null ? 3600 : goal.today_goal;
            if (total == null) total = 0;
            if (pauseCount == null) pauseCount = 0;
            var achievementRate = (total == null) ? 0 : (total / goal.today_goal) * 100;
            var continuousConcentration = pauseCount == 0 ? 0 : parseInt(total / pauseCount);

            var loadDayStatResult = {
                //그래프
                subjects: subjects,

                //나와의 비교
                total: total,
                goal: todayGoal,
                achievementRate: achievementRate,
                continuousConcentration: continuousConcentration,

                //타인과의 비교
                ranking: ranking.ranking,
                totalUser: ranking.totalUser,
                avaerageGoal: averageGoal,
                highestTime: ranking.highestTime,
                averageTime: ranking.averageTime,
            }
            res.status(200).send(loadDayStatResult);

        }).catch(function (err) {
            console.log(err);
            return res.status(400).send(err);
        });
});

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

function selectSubjectTerm(userId, targetTime) {
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

function selectSubjectGoals(userId, targetTime) {
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
