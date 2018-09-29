var express = require('express');
var router = express.Router();
var db = require('../config/db');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;



/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



//1. 로그인
router.post('/login',
  passport.authenticate('local-login', {
    failureRedirect: '/users/fail',
    failureFlash: true
  }), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
  function (req, res) {
    res.redirect('/users/success/' + req.user.id);
  });

//1-1. 로그인 성공
router.get('/success/:id', function (req, res) {
  console.log('login success id:' + req.params.id);
  res.send('respond with a resource');
});

//1-2. 로그인 실패
router.get('/fail', function (req, res) {
  res.send('login fail');
});


//1-3. 로그아웃
router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
})


//2. 회원가입
router.post('/join', passport.authenticate('local-join', {
  successRedirect: '/users/',
  failureRedirect: '/users/join',
  failureFlash: true
}));



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
