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
        usernameField: 'googleId',
        passwordField: 'googleId',
        passReqToCallback: true
    }, function (req, googleId, googleId, done) {
        var sqlSelectUsers = "SELECT id FROM users WHERE google_id = ?";
        db.get().query(sqlSelectUsers, req.body.googleId, function (err, rows) {
            if(err) {
                return done(err);
            }
            //실패
            else if (rows[0] == undefined) {
                return done(false, null);
            } 
            //성공
            else {
                return done(null, {
                    id: rows[0].id
                });
            }
        });
       }
    ));

    passport.use('local-join', new LocalStrategy({
        usernameField: 'name',
        passwordField: 'googleId',
        passReqToCallback: true
    }, function (req, name, googleId, done) {
        var sqlInsertUsers = "INSERT INTO users (google_id, name) VALUES (?, ?)";
        db.get().query(sqlInsertUsers, [req.body.googleId, req.body.name], function (err, rows) {
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
    
    /*
    passport.use('local-login', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true //인증을 수행하는 인증 함수로 HTTP request를 그대로  전달할지 여부를 결정한다
    }, function (req, username, password, done) {
        console.log('h');
        
        if (username === '1' && password === 'password') {
            return done(null, {
                'id': username,
            });
        } else {
            return done(false, null)
        }
    }));
    */
    
};
