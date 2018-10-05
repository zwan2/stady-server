var express = require('express');
var router = express.Router();
var db = require('../config/db');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



//1.1. 로그인
router.post('/login',
  passport.authenticate('local-login'),
  function (req, res) {
    var jsonSession = {
      userId: req.user.id,
      sessionId: req.sessionID
    }
    return res.status(200).send(JSON.stringify(jsonSession));
});


//1.2. 로그아웃
router.get('/logout', function (req, res) {
  req.logout();
  return res.sendStatus(200);
})

//1.3. 세션로그인
router.post('/sessionLogin',
  passport.authenticate('local-sessionLogin'),
  function (req, res) {
    var jsonSession = {
      userId: req.user.id,
      sessionId: req.sessionID
    }
    return res.status(200).send(JSON.stringify(jsonSession));
  });

//2. 회원가입
router.post('/join', passport.authenticate('local-join'), 
  function(req, res) {
    var jsonSession = {
      userId: req.user.id,
      sessionId: req.sessionID
    }
    return res.status(200).send(JSON.stringify(jsonSession));
});


/* /stopwatch로 이전했음
//REQ: userId RES: arr[], total_goal, subject_goals
router.get('/loadMain', function (req, res, next) {
  var querySelectGoal = "SELECT total_goal, subject_goals FROM user_goals WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) ORDER BY reg_time DESC LIMIT 1";
  var querySelectHistory = "SELECT subject_id, study_id, SUM(term) " + "term_sum" + " FROM histories WHERE user_id = ? AND exam_address = (SELECT exam_address FROM user_settings d WHERE d.user_id = ?) GROUP BY subject_id AND study_id";
  //var querySelectHistory = "SELECT exam_address FROM user_settings d WHERE d.user_id = ?";
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
*/


module.exports = router;
