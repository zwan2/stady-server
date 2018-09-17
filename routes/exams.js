var express = require('express');
var router = express.Router();
var db = require('../config/db');


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

/*
//REQ: userId, RES: exam_addresses
//유저의 시험 정보 리스트 불러오기
router.get('/loadExams', function (req, res, next) {
  var querySelectUsersData = "SELECT exam_addresses FROM user_data WHERE user_id = ?";
  db.get().query(querySelectUsersData, req.query.userId, function (err, rows) {
    if (err) {
      return res.status(400).send(err);
    } else {
      return res.status(200).send(JSON.stringify(rows[0]));
    }
  });
});
*/

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

//최초등록

module.exports = router;
