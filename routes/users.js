var express = require('express');
var router = express.Router();
var db = require('../config/db');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;

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



module.exports = router;
