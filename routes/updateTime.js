var db = require('../config/db');
var moment = require('moment');

global.sendError = function(res, err) {
    res.status(400).send(err);
}

global.sendCode = function(res, code) {
    res.sendStatus(code);
}

global.userSettingsUpdated = function(userId, callback) {
    var querySelectTime = "SELECT updated_at FROM user_settings WHERE user_id = ? LIMIT 1";
    db.get().query(querySelectTime, userId, function (err, rows) {
        if (err) callback(err);
        else {
            var updatedAt = moment(rows[0].updated_at).format('YYYY-MM-DD HH:mm:ss');;            
            callback(null, updatedAt);
        }
    });
}

global.selectUpdatedAt = function(tableName, id, callback) {
    var querySelectTime = "SELECT updated_at FROM " + tableName + " WHERE id = ? ORDER BY updated_at DESC LIMIT 1";
    db.get().query(querySelectTime, id, function (err, rows) {
        if (err) callback(err);
        else  callback(null, newTime);
    });
}

exports.this;