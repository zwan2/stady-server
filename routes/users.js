var express = require('express');
var router = express.Router();
var db = require('../config/db');


/* GET users listing. */
router.get('/', function(req, res, next) {
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

//REQ: userId RES: arr[], total_goal, subjects_goal

router.get('/loadMain', function (req, res, next) {
  var querySelectGoal = "SELECT total_goal, subjects_goal FROM user_goals WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_data d WHERE d.user_id = ?) ORDER BY reg_time DESC LIMIT 1";
  var querySelectHistory = "SELECT subject_id, study_id, SUM(term) " + "term_sum" + " FROM histories WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_data d WHERE d.user_id = ?) GROUP BY subject_id AND study_id";
  //var querySelectHistory = "SELECT exam_address FROM user_data d WHERE d.user_id = ?";
  db.get().query(querySelectGoal, [req.query.userId, req.query.userId], function (err, rows1) {
    if (err) {
      return res.status(400).send(err);
    } else {
     
      db.get().query(querySelectHistory, [req.query.userId, req.query.userId], function (err, rows2) {
        if (err) {
          return res.status(400).send(err);
        } else {
          //console.log(rows1[0]);
          //console.log(rows2);
          
          var rows = Object.assign(rows1[0], rows2);
          //console.log(rows);
          
          return res.status(200).send(JSON.stringify(rows));
        }
    
      });
    }

  });
});

//최초등록

module.exports = router;
