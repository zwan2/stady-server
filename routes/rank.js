var express = require('express');
var router = express.Router();
var db = require('../config/db');
var moment = require('moment');


router.get('/loadRank', function (req, res, next) {

    var userId = req.query.userId;

    var selectMonthlyTotal = "SELECT SUM(term) AS total FROM histories WHERE user_id = ? AND " +
                            "date(end_point) >= date(subdate(now(), INTERVAL 30 DAY)) AND " +
                            "date(end_point) <= date(now())";

    db.get().query(selectMonthlyTotal, userId, function(err, rows) {
        if (err) return res.status(400).send(err);

        var avgT = rows[0].total;

        return res.status(200).send(loadRank(avgT, 90, 7200));
    });

});

function loadRank(avgT, avgAR, avgCC) {
    // var avgT = 3600; //Total
    // var avgAR = 90.6; //AchievementRate
    // var avgCC = 1800; //ContinuousConcentration

    var scoreT = getTotalScore(avgT);
    var scoreAR = getAchievementRateScore(avgAR);
    var scoreCC = getContinuousConcentrationScore(avgCC);

    return getRank(scoreT + scoreAR + scoreCC);;
}

function getTotalScore(total) {
    if (total >= 12 * 3600) {
        return 10;
    } else if (total >= 10 * 3600) {
        return 9;
    } else if (total >= 8 * 3600) {
        return 8;
    } else if (total >= 6 > 3600) {
        return 7;
    } else if (total >= 4 * 3600) {
        return 6;
    } else if (total >= 2 * 3600) {
        return 5;
    } else {
        return 3;
    }
}

function getAchievementRateScore(ar) {
    if (ar >= 90) {
        return 10;
    } else if (ar >= 80) {
        return 9;
    } else if (ar >= 70) {
        return 8;
    } else if (ar >= 60) {
        return 7;
    } else if (ar >= 50) {
        return 6;
    } else if (ar >= 40) {
        return 5;
    } else {
        return 0;
    }
}

function getContinuousConcentrationScore(cc) {
    if (cc >= 2 * 3600) {
        return 10;
    } else if (cc >= 1.5 * 3600) {
        return 9;
    } else if (cc >= 1.25 * 3600) {
        return 8;
    } else if (cc >= 1 * 3600) {
        return 7;
    } else if (cc >= 0.75 * 3600) {
        return 6;
    } else if (cc >= 0.5 * 3600) {
        return 5;
    } else {
        return 0;
    }
}

function getRank(score) {
    if (score >= 29) {
        return "A+";
    } else if (score >= 27) {
        return "A";
    } else if (score >= 24) {
        return "B+";
    } else if (score >= 21) {
        return "B";
    } else if (score >= 18) {
        return "C+";
    } else if (score >= 15) {
        return "C";
    } else {
        return "F";
    }
}

module.exports = router;