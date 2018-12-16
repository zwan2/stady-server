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
        var querySelectExam0 = "SELECT id, title FROM exam_cat0";
        db.get().query(querySelectExam0, function (err, rows) {
           console

            if (err) return res.status(400).send(err);
            return res.status(200).send(JSON.stringify(rows));
        });
    } else if (req.query.examCat == 1) {
        var querySelectExam1 = "SELECT id, title FROM exam_cat1 WHERE parent_id = ?";
        db.get().query(querySelectExam1, req.query.examParentId, function (err, rows) {
            if (err) return res.status(400).send(err);
            return res.status(200).send(JSON.stringify(rows));
        });
    } else if ((req.query.examCat == 2)) {
        var querySelectExam2 = "SELECT id, title FROM exam_cat2 WHERE parent_id = ?";
        db.get().query(querySelectExam2, req.query.examParentId, function(err, rows) {
            if (err) return res.status(400).send(err);
            
            if (rows == "") {
                return res.sendStatus(204);
            } else {
                return res.status(200).send(JSON.stringify(rows));
            }

            
        });
    } else {
        return res.status(200).send(null);
    }
});

//과목 목록을 보여줌
//REQ: examAddress
router.get('/selectSubject', function(req, res, next) {
    var querySelectSubject = "SELECT id, title FROM subjects WHERE exam_address = ?";
    db.get().query(querySelectSubject, req.query.examAddress, function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.status(200).send(JSON.stringify(rows));
    });
});

//시험, 과목 저장
//REQ: examAddress, subject_ids, userId
router.post('/saveCondition', isAuthenticated, function (req, res, next) {
    console.log(req.body.examAddress);
    console.log(req.body.userId);
    
    var queryUpdateData = "UPDATE user_settings SET exam_address = ?, subject_ids = ? WHERE user_id = ?";
    db.get().query(queryUpdateData, [req.body.examAddress, req.body.subjectIds, req.body.userId], function (err, rows) {
        if (err) return res.status(400).send(err);
        return res.sendStatus(200);
    });
});


//DB 데이터를 모두 보내줌
//REQ: tableName = jsonArray EX: ["exam_cat0", "exam_cat2", "subjects"]
router.get('/getDB', function(req, res, next) {
    var tableName = req.query.tableName;
    var tableNameObject = JSON.parse(tableName);

    var workFinished = new Array();
    var totalResult = new Object();

    for (var i in tableNameObject) {
        workFinished[i] = false;

        getDB(tableNameObject[i], i, function(err, index, result) {
            if (err) return res.status(400).send(err);
            else {                
                totalResult[tableNameObject[index]] = result;
                workFinished[index] = true;
                
                getDBFinished(res, workFinished, totalResult);
            }
        });
    }
});

global.getDBFinished = function(res, workFinished, result) {
    var everything;

    for (var j in workFinished) {
        if (workFinished[j]) {
            everything = true;
        }
        else {
            everything = false;
            break;
        }
    }

    if (everything) {
        return res.status(200).send(result);
    }
}

global.getDB = function(tableName, index, callback) {
    var querySelectTable = "SELECT * FROM " + tableName;
    db.get().query(querySelectTable, function (err, rows) {
        if (err) callback(err);
        else {
            callback(null, index, rows);
        }
    });
}


module.exports = router;
