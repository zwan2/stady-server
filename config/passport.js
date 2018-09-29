var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var db = require('../config/db');

module.exports = function (passport) {

    passport.serializeUser((user, done) => { // Strategy 성공 시 호출됨
        console.log("session saved id:", user.id);
        done(null, user.id); // 여기의 user가 deserializeUser의 첫 번째 매개변수로 이동
    });

    passport.deserializeUser((user, done) => { // 매개변수 user는 serializeUser의 done의 인자 user를 받은 것
        done(null, user); // 여기의 user가 req.user가 됨
    });


    //req.body.googleId가 DB에 있는지 검사
    //body -x-www-form-urlencoded googleId : ?
    //콜백함수 인자 4개 필수
    passport.use('local-login', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        
        var sqlSelectUsers = "SELECT id FROM user_accounts WHERE account_id = ? AND account_pw = ?";
        db.get().query(sqlSelectUsers, [req.body.email, req.body.password], function (err, rows1) {
            if(err) {
                return done(err);
            }
            //실패
            else if (rows1[0] == undefined) {
                return done(false, null);
            } 
            //성공
            else {
                console.log(req.sessionID);
                
                var sqlUpdateUsers = "UPDATE user_accounts set session_id = ? WHERE account_id = ? AND account_pw = ?";
                db.get().query(sqlUpdateUsers, [req.sessionID, req.body.email, req.body.password], function (err, rows) {
                    if (err) {
                        return done(err);
                    }
                    return done(null, {
                        id: rows1[0].id
                    });
                });
                
            }
        });
       }
    ));

    passport.use('local-sessionLogin', new LocalStrategy({
        usernameField: 'sessionId',
        passwordField: 'sessionId',
        passReqToCallback: true
    }, function (req, sessionId, sessionId, done) {

        var sqlSelectUsers = "SELECT id FROM user_accounts WHERE session_id = ?";
        db.get().query(sqlSelectUsers, req.body.sessionId, function (err, rows1) {
            if (err) {
                return done(err);
            }
            //실패
            else if (rows1[0] == undefined) {
                return done(false, null);
            }
            //성공
            else {
                console.log(req.sessionID);
                return done(null, {
                    id: rows1[0].id
                });

            }
        });
    }));

    passport.use('local-join', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function (req, email, password, done) {
        var sqlInsertUsers = "INSERT INTO user_accounts (account_id, account_pw) VALUES (?, ?)";
        db.get().query(sqlInsertUsers, [req.body.email, req.body.password], function (err, rows) {
            if (err) {
                return done(false, err);
            } 
            //성공
            else {
                return done(null, {
                    id: rows.insertId
                });
            }
        });
    }));
    
    
};
