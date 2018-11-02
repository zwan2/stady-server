var express = require('express');
var router = express.Router();
var db = require('../config/db');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

  var crypto = require('crypto');

//GLOBAL
global.isAuthenticated = function (req, res, next) {
  //if debug mode
  return next();

  if (req.isAuthenticated()) {
    //console.log(req.sessionID);
    //console.log(req.body.userId);
    return next();
  }
  res.redirect('/users/');
};

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

//2.1. 중복 검사 - 이메일
//REQ: email
router.get('/checkDuplicate/email', isAuthenticated, function (req, res, next) {
  var querySelectName = "SELECT COUNT(*) AS count FROM user_accounts WHERE account_id = ? LIMIT 1;";
  db.get().query(querySelectName, req.query.email, function (err, rows) {
    if (err) return res.status(400).send(err);

    //중복 (재설정 필요)
    if (rows[0].count != 0) {
      return res.sendStatus(205);
    } else {
      //중복X
      return res.sendStatus(200);
    }

  });
});

//2.2. 중복 검사 - 이름
//REQ: name
router.get('/checkDuplicate/name', isAuthenticated, function (req, res, next) {
  var querySelectName = "SELECT COUNT(*) AS count FROM user_settings WHERE name = ? LIMIT 1;";
  db.get().query(querySelectName, req.query.name, function (err, rows) {
    if (err) return res.status(400).send(err);

    //중복 (재설정 필요)
    if (rows[0].count != 0) {
      return res.sendStatus(205);
    } else {
      //중복X
      return res.sendStatus(200);
    }

  });
});

//3.탈퇴
//모든 테이블에서 해당 id에 해당하는 db 지운다? -> 지우지 않아도 되지만 지우면 리소스 확보 가능.
//REQ: email, password
router.post('/withdrawal', isAuthenticated, function (req, res, next) {
  const cipher = crypto.createCipher('aes-256-cbc', 'travrpropic');
  let EncryptedPassword = cipher.update(req.body.password, 'utf8', 'base64');
  EncryptedPassword += cipher.final('base64');
  
  var queryDeleteAccount = "DELETE FROM user_accounts WHERE account_id = ? AND account_pw = ?" 
  db.get().query(queryDeleteAccount, [req.body.email, EncryptedPassword], function (err, rows) {
    if (err) return res.status(400).send(err);
    console.log(rows);
    //console.log(rows.changedRows);
    rows.affectedRows
    
    //탈퇴 성공
    if (rows.affectedRows != 0) {
      req.logout();
      return res.sendStatus(200);
    } else {
      return res.sendStatus(400);
    }
  });

   
});

module.exports = router;
