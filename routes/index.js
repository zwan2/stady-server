var express = require('express');
var fs = require('fs');
var router = express.Router();
var path = require('path');

var db = require('../config/db');
var moment = require('moment');


router.get('/', function(req, res, next) {

  var querySelectLanding = "SELECT apk_link, version_status, version_real, changes FROM landing ORDER BY id DESC LIMIT 1";
  db.get().query(querySelectLanding, function (err, rows1) {
    var querySelectNotice = "SELECT reg_date, notice FROM notice ORDER BY id DESC LIMIT 1";
    db.get().query(querySelectNotice, function (err, rows2) {
      var nowTime = moment(rows2[0].reg_date).format('YYYY-MM-DD HH:MM:SS');
      var querySelectComment = "SELECT reg_date, comment FROM bug_report ORDER BY id DESC";
      db.get().query(querySelectComment, function (err, rows3) {
        res.render('landing', {
          apkLink: rows1[0].apk_link,
          versionStatus: rows1[0].version_status,
          versionReal: rows1[0].version_real,
          changes: rows1[0].changes,
          reg_date: nowTime,
          notice: rows2[0].notice,
          comment: rows3
        });
      });
  
    });
  });
});


router.get('/landingUpdate', function(req, res, next) {
  var querySelectNotice = "SELECT notice FROM notice ORDER BY id DESC LIMIT 1";
  db.get().query(querySelectNotice, function (err, rows) {
    res.render('landingUpdate',{
      notice: rows[0].notice
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
  var nowTime = moment().format();
  var queryInsertNotice = "INSERT INTO notice (reg_date, notice) VALUES (?,?) ON DUPLICATE KEY UPDATE reg_date = ?, notice = ?";
  db.get().query(queryInsertNotice, [nowTime, req.body.notice, nowTime, req.body.notice], function (err, rows) {
    if (err) return res.status(400).send(err);
    res.send("<script>location.href='/';alert('수정 완료');</script>");
  });
});
router.get('/bugReport', function (req, res, next) {
  var querySelectComment = "SELECT reg_date, comment FROM bug_report ORDER BY id DESC";
  db.get().query(querySelectComment, function (err, rows) {
    res.render('bugReport', {
      comment: rows
    });
  });
});

router.post('/bugReport', function (req, res, next) {
  var nowTime = moment().format('YYYY-MM-DD HH:mm');
  var queryInsertReport = "INSERT INTO bug_report (reg_date, comment) VALUES (?,?)";
  db.get().query(queryInsertReport, [nowTime, req.body.comment], function (err, rows) {
    if (err) return res.status(400).send(err);
    res.send("<script>location.href='/';alert('등록 완료');</script>");
  });
});


module.exports = router;
