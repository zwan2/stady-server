var express = require('express');
var router = express.Router();
var db = require('../config/db');

//시험별 통계치(통계명, 통계값) 불러옴
//(확장성을 위해서 통계명-통계값 쌍을 불러오도록 했는데.. 순서를 서로 합의하고 통계값만 주루룩 불러와도 됨.)
router.get('/loadExamData', function(req,res,next) {
    var querySelectStatistics = "SELECT id, title, content, base_date FROM histories_statistics WHERE exam_address = ?";
    db.get().query(querySelectStatistics, req.query.examAddress, function (err, rows1) {
        if (err) {
            return res.status(400).send(err);
        } else {
           return res.status(200).send(JSON.stringify(rows));
        }
    });
});


router.get.

module.exports = router;
