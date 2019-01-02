//GLOBAL
global.isAuthenticated = function (req, res, next) {
  //if debug mode
  return next();

  if (req.isAuthenticated()) {
    //console.log(req.sessionID);
    //console.log(req.body.userId);
    return next();
  }
  res.sendStatus(401);
};
var express = require('express');
var router = express.Router();
var db = require('../config/db');
var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var stopwatch = require('./stopwatch');

global.crypted = function (password) {
  const cipher = crypto.createCipher('aes-256-cbc', 'travrpropic');
  let EncryptedPassword = cipher.update(password, 'utf8', 'base64');
  EncryptedPassword += cipher.final('base64');
  return EncryptedPassword;
}

function randomPassword() {
  var ipassword = "0123456789";
  var epassword = "abcdefghijklmnopqrstuvwxyz";
  var spassword = "!@#$%"
  var password = "";

  for (var i = 0; i < 4; i++) {
    password += ipassword.charAt(Math.floor(Math.random() * ipassword.length));
  }
  for (var i = 0; i < 3; i++) {
    password += epassword.charAt(Math.floor(Math.random() * epassword.length));
  }
  password += spassword.charAt(Math.floor(Math.random() * spassword.length));
  
  return password;
}

//1.1. 로그인
router.post('/login',
  passport.authenticate('local-login'),
  function (req, res) {
    var jsonSession = {
      userId: req.user.id,
      sessionId: req.sessionID
    }
    return res.status(200).send(jsonSession);
});

//1.2. 로그아웃
router.get('/logout', function (req, res) {
  req.logout();
  return res.sendStatus(200);
})

//1.3. 세션로그인
router.post('/sessionLogin', passport.authenticate('local-sessionLogin'), function (req, res) {
    var jsonSession = {
      userId: req.user.id,
      sessionId: req.sessionID
    }
    return res.status(200).send(JSON.stringify(jsonSession));
  });

//2. 회원가입
router.post('/join', passport.authenticate('local-join'), function(req, res) {
  var logging = {
    email: req.body.email,
    password: req.body.password,
    name: req.body.name,
    birthDate: req.body.birthDate,
    gender: req.body.gender
  }

  var jsonSession = {
    userId: req.user.id,
    sessionId: req.sessionID
  }
  return res.status(200).send(jsonSession);
});

//2.1. 중복 검사 - 이메일
//REQ: email
router.get('/checkDuplicate/email', isAuthenticated, function (req, res, next) {
  var email = req.query.email;

  if (email == null) {
    return res.sendStatus(400);
  }

  var sqlSelectName = "SELECT COUNT(*) AS count FROM user_accounts WHERE account_id = ? LIMIT 1;";
  db.get().query(sqlSelectName, email, function (err, rows) {
    if (err) return res.status(400).send(err);

    if (rows[0].count != 0) {
      //중복 (재설정 필요)
      return res.status(200).send('Duplicated');
    }
    else {
      //중복X
      return res.sendStatus(200);
    }
  });
});

//2.2. 중복 검사 - 이름
//REQ: name
router.get('/checkDuplicate/name', isAuthenticated, function (req, res, next) {
  var name = req.query.name;

  if (name == null) {
    return res.sendStatus(400);
  }

  var sqlSelectName = "SELECT COUNT(*) AS count FROM user_settings WHERE name = ? LIMIT 1;";
  db.get().query(sqlSelectName, name, function (err, rows) {
    if (err) return sendError(res, err);

    if (rows[0].count != 0) {
      //중복 (재설정 필요)
      return res.status(200).send('Duplicated');
    }
    else {
      //중복X
      return res.sendStatus(200);
    }
  });
});

//3. 비밀번호 찾기
//REQ: email
router.post('/findPassword', function(req, res, next) {
  var email = req.body.email;

  if (email == null) {
    return res.sendStatus(400);
  }

  var newPassword = randomPassword();
  var EncryptedPassword = crypted(newPassword);
  console.log(newPassword);
  console.log(EncryptedPassword);


  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'youremail@gmail.com', // gmail 계정 아이디를 입력
      pass: 'yourpassword' // gmail 계정의 비밀번호를 입력
    }
  });

  let mailOptions = {
    from: 'youremail@gmail.com', // 발송 메일 주소 (위에서 작성한 gmail 계정 아이디)
    to: email, // 수신 메일 주소
    subject: '[STADY] 비밀번호가 변경되었습니다.', // 제목
    text: '새 비밀번호는 ' + newPassword + ' 입니다. 다시 로그인해주세요.' // 내용
  };


  var sqlUpdateAccount = "UPDATE user_accounts SET account_pw = ? WHERE account_id = ?";
  db.get().query(sqlUpdateAccount, [EncryptedPassword, req.body.email], function (err, rows) {
    if (err) return res.status(400).send(err);

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
        return res.sendStatus(200);
      }
    });
  });  
});

//4. 탈퇴
//회원관리 기능만 삭제. 특정성만 제거.
//REQ: email, password
router.post('/withdrawal', isAuthenticated, function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;

  if (email == null || password == null) {
    return res.sendStatus(400);
  }

  var EncryptedPassword = crypted(password);
  var queryDeleteAccount = "DELETE FROM user_accounts WHERE account_id = ? AND account_pw = ?";

  db.get().query(queryDeleteAccount, [email, EncryptedPassword], function (err, rows) {
    if (err) return sendError(res, err);
    
    if (rows.affectedRows != 0) {
      //탈퇴 성공
      req.logout();
      return res.sendStatus(200);
    }
    else {
      //인증 실패
      return res.sendStatus(401);
    }
  });
});

//5. 비밀번호 변경
// REQ: email, currentPassword, newPassword
// 성공: redirect /logout, 실패: 412
router.post('/changePassword', isAuthenticated, function (req, res, next) {
  var email = req.body.email;
  var currentPassword = req.body.currentPassword;
  var newPassword = req.body.newPassword;

  if (email == null || currentPassword == null || newPassword == null) {
    return res.sendStatus(400);
  }

  var encryptedCurrentPassword = crypted(currentPassword);
  var encryptedNewPassword = crypted(newPassword);
  var querySelectAccount = "SELECT id FROM user_accounts WHERE account_id = ? AND account_pw = ?";
  var queryUpdateAccount = "UPDATE user_accounts SET account_pw = ? WHERE id = ?";

  db.get().query(querySelectAccount, [email, encryptedCurrentPassword], function (err, rows1) {
    if (err) return sendError(res, err);
    
    if (rows1[0] == null) {
      return res.sendStatus(401);
    }
    db.get().query(queryUpdateAccount, [encryptedNewPassword, rows1[0].id], function (err, rows2) {
      if (err) return sendError(res, err);
      return res.sendStatus(200);
    });
  });
});

//6. 닉네임 변경
// REQ: email, name
router.post('/changeName', isAuthenticated, function (req, res, next) {
  var userId = req.body.userId;
  var name = req.body.name;

  if (userId == null || name == null) {
    return res.sendStatus(400);
  }

  var queryUpdateSetting = "UPDATE user_settings SET name = ? WHERE user_id = ?";

  db.get().query(queryUpdateSetting, [name, userId], function (err, rows) {
    if (err) sendError(res, err);
    
    userSettingsUpdated(userId, function(err, newTime) {
      if (err) sendError(res, err);
      return res.status(200).send(JSON.stringify(newTime));
    });
  });

});

// 6. emoji, color 업데이트
// REQ: userId, emoji, color
router.post('/changeInformation', isAuthenticated, function (req, res, next) {
  var userId = req.body.userId;
  var emoji = req.body.emoji;
  var color = req.body.color;
  
  var query = "UPDATE user_settings SET ";
  var queryVar = new Array();

  var comma = false;
  var count = 0;
  var where = " WHERE user_id = ? LIMIT 1";

  //emoji
  if (emoji != undefined) {
    query += "emoji = ?";
    comma = true;
    queryVar[count++] = emoji;
  }
  //color
  if (color != undefined) {
    if (comma) {
      comma = false;
      query += ",";
    }
    query += "color = ?";
    comma = true;
    queryVar[count++] = color;
  }

  if (count == 0) {
    return res.sendStatus(400);
  }
  queryVar[count++] = userId;
  
  
  db.get().query(query + where, queryVar, function (err, rows) {
    if (err) return res.status(400).send(err);
    return res.sendStatus(200);
  });

});


/*
//아직안씀~
//7. 정보 변경
// REQ: email, password, name, gender, birthDate
router.post('/edit', isAuthenticated, function (req, res, next) {
  var EncryptedPassword = crypted(req.body.password);
  var querySelectAccount = "SELECT id FROM user_accounts WHERE account_id = ? AND account_pw = ?";
  var queryUpdateSetting = "UPDATE user_settings SET name = ?, gender = ?, birth_date = ? WHERE user_id = ?";
  db.get().query(querySelectAccount, [req.body.email, EncryptedPassword], function (err, rows1) {
    if (err) return res.status(400).send(err);
    
    //불일치
    if (rows1[0].id == null) {
      return res.sendStatus(400);
    } 
    //일치
    else {
      db.get().query(queryUpdateSetting, [req.body.name, req.body.gender, req.body.birthDate, rows1[0].id], function (err, rows2) {
        if (err) return res.status(400).send(err);
        //console.log(rows2);
        
        if(rows2.affectedRows !=0) {
          return res.sendStatus(200);
        } else {
          return res.sendStatus(204);
        }
          
      });

    }

  });
});
*/

//맞춰보기
//REQ: userId, timeOffset(분 단위)
router.post('/changeTimeOffset', isAuthenticated, function (req, res, next) {
  var queryUpdateTimeOffset = "UPDATE user_settings SET time_offset = ? WHERE user_id = ?";

  db.get().query(queryUpdateTimeOffset, [req.body.timeOffset, req.body.userId], function (err, rows1) {
    if (err) return res.status(400).send(err);
    return res.sendStatus(200);
  });
});


module.exports = router;
