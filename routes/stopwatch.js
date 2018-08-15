var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

//스톱워치 시작버튼
router.post('/start', function (req, res, next) {
    //테이블마다 달라야 함
    var queryInsertData = "INSERT INTO ? (user_id, exam_id, study_id) VALUES (?, ?, ?);";
    
    //usersData 있으면 daily data에 추가, 없으면 INSERT
    var queryInsertUsersData = "INSERT INTO users_data(user_id, data_table_code, daily_data, study_date) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id = ? AND study_date = ?, daily_data = CONCAT(daily_data, ?);"
   
});
module.exports = router;
