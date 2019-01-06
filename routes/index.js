var express = require('express');
var fs = require('fs');
var router = express.Router();
var path = require('path');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;

var db = require('../config/db');
var moment = require('moment');


router.get('/', function(req, res, next) {

  var querySelectLanding = "SELECT apk_link, version_status, version_real, changes FROM landing ORDER BY id DESC LIMIT 1";
  db.get().query(querySelectLanding, function (err, rows1) {

    var querySelectNotice = "SELECT content, notice FROM notice ORDER BY id DESC LIMIT 1";
    db.get().query(querySelectNotice, function (err, rows2) {

      //var nowTime = moment(rows2[0].reg_date).format('YYYY-MM-DD HH:mm:ss');
      var querySelectComment = "SELECT reg_date, comment FROM bug_report ORDER BY id DESC";
      db.get().query(querySelectComment, function (err, rows3) {

        res.render('landing', {
          apkLink: rows1[0].apk_link,
          versionStatus: rows1[0].version_status,
          versionReal: rows1[0].version_real,
          changes: rows1[0].changes,
          notice: rows2[0].notice,
          content: rows2[0].content,
          comment: rows3
        });

      });
    });
  });
});


router.get('/landingUpdate', function(req, res, next) {
  var querySelectNotice = "SELECT notice, content FROM notice ORDER BY id DESC LIMIT 1";
  db.get().query(querySelectNotice, function (err, rows) {
    res.render('landingUpdate',{
      notice: rows[0].notice,
      content: rows[0].content
    });
  });
});
router.post('/landingUpdate', function(req, res, next){
  var queryInsertLanding = "INSERT INTO landing (apk_link, version_status, version_real, changes) VALUES (?,?,?,?)";
  db.get().query(queryInsertLanding, [req.body.apkLink, req.body.versionStatus, req.body.versionReal, req.body.changes], function (err, rows) {
    if (err) return res.status(400).send(err); 
    res.send("<script>location.href='/';alert('수정 완료');</script>");

  });
});

router.post('/noticeUpdate', function(req, res, next) {
  var nowTime = moment().format('YYYY-MM-DD HH:mm');
  var queryInsertNotice = "INSERT INTO notice (reg_date, notice, content) VALUES (?,?,?) ON DUPLICATE KEY UPDATE reg_date = ?, notice = ?";
  db.get().query(queryInsertNotice, [nowTime, req.body.notice, req.body.content, nowTime, req.body.notice], function (err, rows) {
    if (err) return res.status(400).send(err);
    res.send("<script>location.href='/';alert('수정 완료');</script>");
  });
});
router.get('/bugReport', function (req, res, next) {
  var querySelectComment = "SELECT b.reg_date, b.comment, b.user_id, a.account_id FROM bug_report AS b JOIN user_accounts AS a WHERE a.id = b.user_id ORDER BY b.id DESC";
  //var querySelectMyEmail = "SELECT account_id FROM user_accounts WHERE id = ? LIMIT 1";

  db.get().query(querySelectComment, function (err, rows) {

    for (var i=0 ; i<rows.length ; i++) {
      rows[i].reg_date = moment(rows[i].reg_date).format('YY/MM/DD HH:mm:ss');
    }

    res.render('bugReport', {
      comment: rows,
      userId: req.query.userId
    });

  });
});

router.post('/bugReport', function (req, res, next) {  
  var nowTime = moment().format('YYYY-MM-DD HH:mm:ss');
  var queryInsertReport = "INSERT INTO bug_report (reg_date, comment, user_id) VALUES (?,?,?)";
  db.get().query(queryInsertReport, [nowTime, req.body.comment, req.body.userId], function (err, rows) {
    if (err) return res.status(400).send(err);
    res.send("<script>location.href='/bugReport?userId=" + req.body.userId + "';</script>");
  });
});


router.get('/privacyPolicy', function (req, res, next ){
  res.render('privacyPolicy');
});

router.get('/admin', isLoggedIn, function(req, res, next) {
  res.render('admin');
});

router.get('/login', function (req, res, next ){
  res.render('admin/login');
});

router.post('/login',
  passport.authenticate('admin-login', {
    successRedirect : '/admin', 
    failureRedirect : '/admin', //로그인 실패시 redirect할 url주소
    failureFlash : true
  }));

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  } else {
      res.redirect('/login');
  }
}

router.get('/versionHistory', function (req, res, next) {
  var querySelectLanding = "SELECT version_real, changes, updated_at FROM landing ORDER BY id DESC";
  db.get().query(querySelectLanding, function (err, rows) {
    console.log(rows);

    res.render('versionHistory', {
      versionHistory: rows
    });

  });
});

router.get('/notice', function(req, res, next) {
  var querySelectNotice = "SELECT id, notice, reg_date FROM notice ORDER BY id DESC";
  db.get().query(querySelectNotice, function (err, rows) {
    console.log(rows);

    res.render('notice/index', {
      notice: rows
    });
  });
});

router.get('/notice/detail', function (req, res, next) {
  var querySelectNotice = "SELECT notice, content, reg_date FROM notice WHERE id = ? ORDER BY id DESC";
  db.get().query(querySelectNotice, req.query.id, function (err, rows) {

    res.render('notice/detail', {
      notice: rows
    });

  });
});


router.get('/download', function(req, res, next) {
  res.redirect('https://play.google.com/store/apps/details?id=com.paribus.stady');
});


module.exports = router;