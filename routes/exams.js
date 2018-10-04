var express = require('express');
var router = express.Router();
var db = require('../config/db');


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//시험 목록을 보여줌.
//REQ: req.query.examCat, req.query.examParentId
router.get('/selectExam', function (req, res, next) {
    if (req.query.examCat == 0 && req.query.examParentId == 0) {
        var querySelectExam0 = "SELECT title FROM exam_cat0";
        db.get().query(querySelectExam0, function (err, rows) {
            if (err) return res.status(400).send(err);
            return res.status(200).send(JSON.stringify(rows));
        });
    } else if (req.query.examCat == 1) {
        var querySelectExam1 = "SELECT title FROM exam_cat1 WHERE parent_id = ?";
        db.get().query(querySelectExam1, req.query.examParentId, function (err, rows) {
            if (err) return res.status(400).send(err);
            return res.status(200).send(JSON.stringify(rows));
        });
    } else if ((req.query.examCat == 2)) {
        var querySelectExam2 = "SELECT title FROM exam_cat2 WHERE parent_id = ?";
        db.get().query(querySelectExam2, req.query.examParentId, function(err, rows) {
            if (err) return res.status(400).send(err);
            return res.status(200).send(JSON.stringify(rows));
        });
    } else {
        return res.status(200).send(null);
    }
});

//과목 목록을 보여줌
//REQ: examAddress
router.get('/selectSubject', function(req, res, next) {
    var querySelectSubject = "SELECT title FROM subjects WHERE exam_address = ?";
    db.get().query(querySelectSubject, req.query.examAddress, function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });
});

//시험 변경
//REQ: examAddress, userId
router.post('/saveExam', function(req, res, next) {
    console.log(req.body.examAddress);
    console.log(req.body.userId);
    
    var queryUpdateData = "UPDATE user_data SET exam_address = ? WHERE user_id = ?";
    db.get().query(queryUpdateData, [req.body.examAddress, req.body.userId], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.sendStatus(200);
    });
});


module.exports = router;
