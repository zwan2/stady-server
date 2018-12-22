var express = require('express');
var router = express.Router();
var db = require('../config/db');

var moment = require('moment');
var moment = require('moment-timezone');


/**
 * GET: /loadSettings
 * QUERY: userId, updatedAt
 * RESPOND: 
 */

router.get('/loadSettings', isAuthenticated, function (req, res) {
    loadSettings(req.query.userId, req.query.updatedAt, function(err, code, settings) {
        if (err) return sendError(res, err);
        if (code) return sendCode(res, code);
        return res.status(200).send(settings);
    });
});

global.loadSettings = function(userId, updatedAt, callback) {
    isUpdateAvailable("user_settings", userId, updatedAt, function(err, available, updatedAt) {
        if (err) return callback(err);

        else if (available == null) {
            //Unauthorized
            return callback(null, 401);
        }

        else if (available) {
            //There is update. We need to send a new information.
            getSettings(userId, function(err, code, name, color, emoji, examAddress, subjectIds, timeOffset) {
                if (err) return callback(err);
    
                if (code) return callback(null, 401);

                loadTitles(examAddress, function(err, examTitle) {
                    if (err) return callback(err);

                    getDBUpdatedAt(function(err, dbUpdatedAt) {
                        loadSubjectTitles(subjectIds, function(err, subjectTitles) {
                            if (err) return callback(err);
    
    
                            if (subjectIds.length != subjectTitles.length) {
                                return callback("Count of subject ids and titles are different. Weird!");
                            }
    
                            var exam = {
                                address: examAddress,
                                title: examTitle
                            }
    
                            var subjects = new Array();
                            for (var i=0 ; i<subjectIds.length ; i++) {
                                subjects[i] = {
                                    id: subjectIds[i],
                                    title: subjectTitles[i]
                                }
                            }
                            var settings = {
                                name: name,
                                color: color,
                                emoji: emoji,
                                timeOffset: timeOffset,
                                updatedAt: updatedAt,
                                exam: exam,
                                subjects: subjects,
                                dbUpdatedAt: dbUpdatedAt
                            }
    
                            return callback(null, null, settings);
                        });
                    });
                });
            });
        }
        else {
            return callback(null, 204);
        }
    });
}

/**
 * Check update availability and returns boolean value.
 * @param {The table name to check the update} tableName 
 * @param {The user id to check the update} userId 
 * @param {The updated time of local client} updatedAt 
 * @param {*} callback 
 */
global.isUpdateAvailable = function(tableName, userId, updatedAt, callback) {
    var queryCheckUpdate = "SELECT updated_at AS updatedAt FROM " + tableName + " WHERE user_id = ? LIMIT 1";

    db.get().query(queryCheckUpdate, userId, function (err, rows) {
        if (err) callback(err);
        

        else if (rows[0] == undefined) {
            callback(null, null, null);
        }
        else {
            var dbAt = moment(rows[0].updatedAt).format('YYYY-MM-DD HH:mm:ss');

            if (dbAt != updatedAt) {
                callback(null, true, dbAt);
            }
            else {
                callback(null, false, null);
            }
        }
    });
}

/**
 * getSettings returns exam address and subject ids of the user.
 * @param {Id of user on db} userId 
 * @param {Callback to return result of query} callback 
 */
global.getSettings = function(userId, callback) {
    var querySelectSettings = "SELECT name, color, emoji, exam_address, subject_ids, time_offset FROM user_settings WHERE user_id = ?";

    db.get().query(querySelectSettings, userId, function (err, rows) {
        if (err) callback(err);
        //값 없는 경우 예외처리
        else if (rows[0] == undefined || rows[0].exam_address == undefined ||
            rows[0].subject_ids == undefined || rows[0].time_offset == undefined) {
            callback(null, 401, null, null);
        }
        else {
            callback(null, null, rows[0].name, rows[0].color, rows[0].emoji, rows[0].exam_address.split('_'), rows[0].subject_ids.split(','), rows[0].time_offset);
        }
    });
}

/**
 * loadTitles returns title of the corresponding examAddress
 * @param {*} examAddress 
 * @param {*} callback 
 */
global.loadTitles = function(examAddress, callback) {
    var querySelectExamCat = "(SELECT title FROM exam_cat0 WHERE id = ?) UNION (SELECT title FROM exam_cat1 WHERE id = ?) UNION (SELECT title FROM exam_cat2 WHERE id = ?)"

    db.get().query(querySelectExamCat, [examAddress[0], examAddress[1], examAddress[2]], function (err, rows) {
        if (err) callback(err);
        else {
            var examTitle;

            //공무원
            if(examAddress[0] == 1) {
                examTitle = rows[1].title + " · " + rows[2].title;
            } 
            //이외
            else {
                examTitle = rows[0].title + " · " + rows[1].title;
            }

            callback(null, examTitle);
        }
    });
}

/**
 * loadSubjectTitles returns title of the corresponding subjectIds
 * @param {*} subjectIds 
 * @param {*} callback 
 */
global.loadSubjectTitles = function(subjectIds, callback) {
    var querySelectSubjects = "SELECT title FROM subjects WHERE id IN ( " + subjectIds + " )";

    db.get().query(querySelectSubjects, function (err, rows) {
        if (err) callback(err);
        else {
            var titles = new Array();
            for (var i=0 ; i<rows.length ; i++) {
                titles[i] = rows[i].title;
            }

            callback(null, titles);
        }
    });
}

global.getDBUpdatedAt = function(callback) {
    var querySelectDBUpdateAt = "SELECT UPDATE_TIME AS updatedAt " +
                                "FROM information_schema.tables " +
                                "WHERE TABLE_SCHEMA = 'STADY' " +
                                "AND (TABLE_NAME = 'exam_cat0' " +
                                "OR TABLE_NAME = 'exam_cat1' " +
                                "OR TABLE_NAME = 'exam_cat2' " +
                                "OR TABLE_NAME = 'subjects')";
    db.get().query(querySelectDBUpdateAt, function (err, rows) {
        if (err) callback(err);
        else {
            for (var i in rows) {
                rows[i] = moment(rows[i].updatedAt).format('YYYY-MM-DD HH:mm:ss');
            }
            callback(null, rows);
        }
    });
}

//REQ: userId RES: JSON
//메인화면 데이터 로딩 (1. loadSettings, 2. loadHistory)
//REQ: userId, updatedAt, examAddress, subjectIds, timeOffset
router.get('/loadMain', isAuthenticated, function (req, res, next) {

    var userId = req.query.userId;
    var updatedAt = 0; //일단 기능 비활성화
    if (userId == null || updatedAt == null) {
        return sendCode(res, 400);
    }

    //만약 데이터를 보내지 않으면 updatedAt 과 상관없이 무조건 loadSettings를 하도록 만듦
    var examAddress = req.query.examAddress;
    var subjectIds = req.query.subjectIds;
    var timeOffset = req.query.timeOffset;
    if (examAddress == null || subjectIds == null || timeOffset == null) {
        updatedAt = 0;
    }

    loadSettings(userId, updatedAt, function(err, code, settings) {
        if (err) return sendError(res, err);

        if (code) {
            if (code == 204) { //Not using. updatedAt 기능 비활성화해서 작동안하는부분

                //loadHistory with body
                loadHistory(userId, examAddress, subjectIds, timeOffset, function() {
                    var result = {
                        history: history
                    }

                    return res.status(200).send(result);
                });
            }
            else return sendCode(res, code);
        }
        else {
            //loadHistory with settings

            var examAddress = settings.exam.address.join("_");

            var subjectIds = new Array();
            for (var i=0 ; i<settings.subjects.length ; i++) {
                subjectIds[i] = settings.subjects[i].id;
            }

            loadHistory(userId, examAddress, subjectIds, settings.timeOffset, function(err, today, subjects, subjectGoals) {
                if (err) return sendError(res, err);

                settings.exam.address = examAddress;
                settings.today = today;

                for (var i=0 ; i<settings.subjects.length ; i++) {
                    for (var j=0 ; j<subjects.length ; j++) {
                        if (settings.subjects[i].id == subjects[j].id) {
                            settings.subjects[i].total = subjects[j].total;
                        }
                    }
                    for (var k=0 ; k<subjectGoals.length ; k++) {
                        if (settings.subjects[i].id == subjectGoals[k].id) {
                            settings.subjects[i].goal = subjectGoals[k].goal;
                        }
                    }
                }

                return res.status(200).send(settings);
            });
        }
        //return res.status(200).send(settings);

        
    });
    
});

global.loadHistory = function(userId, examAddress, subjectIds, timeOffset, callback) {

    getGoal(userId, function(err, todayGoal, subjectGoals) {
        if (err) return callback(err);        

        var goalResult = new Array();
        if (subjectGoals == null) {
            for (var i in subjectIds) {
                var g = {
                    id: subjectIds[i],
                    goal: 0
                }
                goalResult[i] = g;
            }
        }
        else {
            var goal = subjectGoals.split(",");
            for (var i in goal) {
                var two = goal[i].split(":");
                var g = {
                    id: two[0],
                    goal: two[1]
                }
                goalResult[i] = g;
            }
        }

        getHistory(userId, examAddress, subjectIds, timeOffset, function(err, subjectIds, subjectTotals) {
            if (err) return callback(err);

            var todayTotal = 0;
            for (var i=0 ; i<subjectTotals.length ; i++) {                
                todayTotal += subjectTotals[i];
            }

            var today = {
                goal: todayGoal,
                total: todayTotal
            }

            var subjects = new Array();           

            for (var i=0 ; i<subjectIds.length ; i++) {
                
                var subject = {
                    id: subjectIds[i],
                    total: subjectTotals[i]
                }
                subjects[i] = subject;
            }

            return callback(null, today, subjects, goalResult);
        });

    });
}


global.getGoal = function(userId, callback) {
    var querySelectGoals = "SELECT today_goal AS todayGoal, subject_goals AS subjectGoals FROM user_goals WHERE user_id = ? ORDER BY id DESC LIMIT 1";

    db.get().query(querySelectGoals, userId, function (err, rows) {


        if (err) callback(err);
        else if (rows[0] == null) {             
            callback("unknown error...");
        }
        else {
            callback(null, rows[0].todayGoal, rows[0].subjectGoals);
        }
    });
}

global.getHistory = function(userId, examAddress, subjectIds, timeOffset, callback) {
    //유저별 시간 offset 적용
    //기준시간, offset시간
    //var nowTime = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
    var nowTime = moment("2018-12-22 02:00:26", "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    var baseTime = moment().format("YYYY-MM-DD 00:00:00");
    //var baseTime = moment("2018-12-21 23:00:26").format("YYYY-MM-DD 00:00:00");
    
    //유저 offset(분단위)
    var offsetHour = parseInt(timeOffset / 60);
    var offsetMinute = timeOffset % 60;             
    var offsetTime = moment(baseTime).set({'hour': offsetHour, 'minute': offsetMinute});
   


    //예외처리(기준 시간보다 작은 경우)
    if (nowTime <= moment(offsetTime).format("YYYY-MM-DD HH:mm:ss")) {
        //console.log("전찐:" + offsetTime);
        offsetTime = moment(offsetTime).subtract(1, 'days');
        //console.log("찐:"+offsetTime);
    }

    offsetTime = moment(offsetTime).format("YYYY-MM-DD HH:mm:ss");

    console.log("tO" + timeOffset);
    console.log("nT" + nowTime);
    console.log("bT" + baseTime);
    console.log("oT" + baseTime);

    var querySelectHistory = "SELECT subject_id AS subjectId, SUM(term) AS subjectTotal FROM histories WHERE user_id = ? AND exam_address = ? AND subject_id IN (" + subjectIds + ") AND end_point >= ? AND end_point <= ? GROUP BY subject_id";

    var backup = subjectIds;

    db.get().query(querySelectHistory, [userId, examAddress, offsetTime, nowTime], function (err, rows) {
        if (err) callback(err);
        else if (rows[0] == null) {
            //There is no history data for today.

            var subjectTotals = new Array();
            for (var i in backup) {
                subjectTotals[i] = 0;
            }

            callback(null, backup, subjectTotals);
        }
        else {
            var subjectIds = new Array();
            var subjectTotals = new Array();

            for (var i=0 ; i<rows.length ; i++) {
                subjectIds[i] = rows[i].subjectId;
                subjectTotals[i] = rows[i].subjectTotal;
            }
            
            callback(null, subjectIds, subjectTotals);
        }
    });
}



//REQ: userId RES: JSON
//메인화면 데이터 로딩 (1. loadSettings, 2. loadHistory)
// router.get('/loadMain', isAuthenticated, function (req, res, next) {
//     //[1] loadSettings
//     var examAddress, subjectIds, examTitle;
//     var querySelectSettings = "SELECT name, exam_address, subject_ids, time_offset FROM user_settings WHERE user_id = ?";
//     var querySelectExamCat = "(SELECT title FROM exam_cat0 WHERE id = ?) UNION (SELECT title FROM exam_cat1 WHERE id = ?) UNION (SELECT title FROM exam_cat2 WHERE id = ?)"
//     //user_settings의 exam_address와 subject_ids로 id->이름 불러옴
//     db.get().query(querySelectSettings, req.query.userId, function (err, rows1) {
//         if (err) return res.status(400).send(err);
        
//         //반드시 rows1[0].exam_address으로 검사
//         if(rows1[0] == undefined || rows1[0].exam_address == undefined) {            
//             return res.sendStatus(401);
//         } 
//         else {
//             examAddress = rows1[0].exam_address.split('_');
//             subjectIds = rows1[0].subject_ids;
//         }

//         db.get().query(querySelectExamCat, [examAddress[0], examAddress[1], examAddress[2]], function (err, rows2) {

//             //공무원
//             if(examAddress[0] == 1) {
//                 examTitle = rows2[1].title + " · " + rows2[2].title;
//             } 
//             //이외
//             else {
//                 examTitle = rows2[1].title;
//             }
            
//             var querySelectSubjects = "SELECT title FROM subjects WHERE id IN (" + rows1[0].subject_ids + ")";
//             db.get().query(querySelectSubjects, function (err, rows3) {
//                 if (err) return res.status(400).send(err);


//                 //유저별 시간 offset 적용
//                 //기준시간, offset시간
    
//                 var nowTime = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");
//                 var baseTime = moment().format("YYYY-MM-DD 00:00:00");

//                 var offsetHour = parseInt(rows1[0].time_offset / 60);
//                 var offsetMinute = rows1[0].time_offset % 60;             
//                 var offsetTime = moment(baseTime).set({'hour': offsetHour, 'minute': offsetMinute});
               

//                 //예외처리(기준 시간보다 작은 경우)
//                 if (nowTime <= moment(offsetTime).format("YYYY-MM-DD HH:mm:ss")) {
//                     //console.log("전찐:" + offsetTime);
//                     offsetTime = moment(offsetTime).subtract(1, 'days');
//                     //console.log("찐:"+offsetTime);
//                 }

//                 offsetTime = moment(offsetTime).format("YYYY-MM-DD HH:mm:ss");
            
//                 console.log(nowTime);

//                 console.log(baseTime);
//                 console.log(offsetTime);
//                 var querySelectGoals = "SELECT today_goal AS todayGoal, subject_goals AS subjectGoals FROM user_goals WHERE user_id = ? ORDER BY id DESC LIMIT 1";
//                 var querySelectHistory = "SELECT subject_id AS subjectId, SUM(term) AS subjectTotal FROM histories WHERE user_id = ? AND exam_address = ? AND subject_id IN (" + subjectIds + ") AND end_point >= ? AND end_point <= ? GROUP BY subject_id";
                
//                 //[2] LoadHistory
//                 db.get().query(querySelectGoals, [req.query.userId, req.query.userId], function (err, rows4) {
//                     if (err) return res.status(400).send(err);
                    
//                     //goal 없는 아이디 접근 가능 코드 (앞으로의 유저는 문제 없음)
//                     if (rows4[0] == undefined) {
//                         rows4[0] = {
//                             todayGoal : 3600,
//                             subject_goals : ""
//                         }
//                     }
                    
//                 var querySelectGoals = "SELECT today_goal AS todayGoal, subject_goals AS subjectGoals FROM user_goals WHERE user_id = ? ORDER BY id DESC LIMIT 1";
//                     db.get().query(querySelectHistory, [req.query.userId, rows1[0].exam_address, offsetTime, nowTime], function (err, rows5) {
//                         if (err) return res.status(400).send(err);
//                         var todayTotal = 0;
//                         for (var i in rows5) {
//                             todayTotal = todayTotal + rows5[i].subjectTotal;
//                         }
                    
//                         var querySelectDBUpdateAt = "SELECT MAX(UPDATE_TIME) AS dbUpdatedAt " +
//                                                 "FROM   information_schema.tables " +
//                                                 "WHERE  TABLE_SCHEMA = 'STADY' " +
//                                                 "AND (TABLE_NAME = 'subjects' " +
//                                                 "OR TABLE_NAME = 'exam_cat0' " +
//                                                 "OR TABLE_NAME = 'exam_cat1' " +
//                                                 "OR TABLE_NAME = 'exam_cat2')";
//                         db.get().query(querySelectDBUpdateAt, [req.query.userId, rows1[0].exam_address, offsetTime, nowTime], function (err, rows6) {
//                             if (err) return res.status(400).send(err);
                        
//                             var loadSettingsResult = {
//                                 "settings": {
//                                     "name": rows1[0].name,
//                                     "examTitle": examTitle,
//                                     "subjectTitles": rows3,
//                                     "examAddress": rows1[0].exam_address,
//                                     "subjectIds": rows1[0].subject_ids,
//                                     "timeOffset": rows1[0].time_offset,
//                                     "dbUpdatedAt": rows5[0].dbUpdatedAt
//                                 },
//                                 "history": {
//                                     "goals" : rows4[0],
//                                     "todayTotal": todayTotal, 
//                                     "subjectHistory": rows5
//                                 }
//                             }

//                             return res.status(200).send(loadSettingsResult);
//                         });
                    
//                     });


//                 });

//             });
//         });
//     });
    
// });

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
            console.log();
            return res.status(200).send(rows);
        }
    });
});




// 스톱워치 정지 기능 histories, statistics table 모두 저장
// REQ: userId, examaddress, subjectId, studyId, startPoint, endPoint, term
router.post('/stop', isAuthenticated, function (req, res, next) {
    //var base_date = moment(req.body.endPoint, "YYYY-MM-DD");
    
    var queryInsertHis = "INSERT INTO histories (user_id, exam_address, subject_id, study_id, start_point, end_point, term) VALUES (?, ?, ?, ?, ?, ?, ?);";
    var queryDuplicateStat = "INSERT INTO statistics (user_id, exam_address, subject_id, study_id, today_total, base_date) VALUES (?, ?, ?, ?, ?, ?)"
                                + "ON DUPLICATE KEY UPDATE today_total = today_total + ?"

    db.get().query(queryInsertHis, [req.body.userId, req.body.examAddress, req.body.subjectId, req.body.studyId, req.body.startPoint, req.body.endPoint, req.body.term], function (err, rows) {
        if (err) return res.status(400).send(err);
        db.get().query(queryDuplicateStat, [req.body.userId, req.body.examAddress, req.body.subjectId, req.body.studyId, req.body.term, req.body.endPoint, req.body.term], function (err, rows) {
            if (err) return res.status(400).send(err);

            return res.sendStatus(200);
        });
               
        
    });

    
})




module.exports = router;
