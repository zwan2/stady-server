var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//custom
var session = require('express-session');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');



//db
var db = require('./config/db');
db.connect(function (err) {
  if (err) {
    console.log('Unable to connect to MySQL.');
    process.exit(1);
  }
  console.log('connected to MySQL.');
});


var app = express();


//custom
//session
app.use(session({
  secret: 'travr20160308',
  resave: false,
  saveUninitialized: true
}));

//passport
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//socket
var http = require('http').Server(app);
var io = require('socket.io')(http);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(__dirname + '../public'));
//app.use(express.static('public'));

//1C1
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);



app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/exams', require('./routes/exams'));
app.use('/stopwatch', require('./routes/stopwatch'));
app.use('/groups', require('./routes/groups'));
app.use('/statistics', require('./routes/statistics'));
require('./routes/updateTime');


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// //먼저 join 후 (start, stop)이 반복됨.
// io.sockets.on('connection', function (socket) {

//   //1. JOIN data.roomname
//   socket.on('join', function (data) {
//     console.log(data);
//     // socket join 을 합니다.
//     socket.join(data.romname);
//     //구성원에게 알림.
//     io.sockets.in(data.roomname).emit('join', data.userid);
//   });

//   // 2. START OR STOP MESSAGE EMIT
//   socket.on('message', function (message) { 
//     io.sockets.in(message.roomname).emit('message', message.message);
//   });


//   socket.on('leave', function (data) {
//     socket.leave(data.roomname);
//     io.sockets.in(data.roomname).emit('user left', data.userid);
//   });
// });


app.listen(3000, function () {
  console.log('Server... on port 3000');
});

//1C1
app.listen(80, function () {
  console.log('Server... on port 80');
});




///////// Firebase 삭제 구문 START ////////
const firestore = new Firestore();
const settings = {/* your settings... */ timestampsInSnapshots: true };
firestore.settings(settings);

const cron = require('node-cron');
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const firestoreDB = admin.firestore();

cron.schedule('* 19 13 * * *', () => {
  console.log('Firebase 삭제 시작');

  deleteCollection(firestoreDB, 'study', 1000, () => {
    console.log('Firebase 삭제 끝');
    console.log('Firebase 추가 시작');

    let data = {
      test: 'test!'
    };
    firestoreDB.collection('study').doc('test').set(data);
    console.log('Firebase 추가 끝');
  });
});

// var schedule = require('node-schedule');

// var scheduler = schedule.scheduleJob('1 0 0 * * *', function () { 
//   console.log('Firebase 삭제 시작');

//   deleteCollection(db, 'study', 1000).then(function() {
//     console.log('Firebase 삭제 끝');
//     console.log('Firebase 추가 시작');

//     var data = {
//       test: 'test!'
//     };
//     db.collection('study').doc('test').set(data);

//     console.log('Firebase 추가 끝');
//   });
// });
// scheduler;

function deleteCollection(db, collectionPath, batchSize) {
  var collectionRef = db.collection(collectionPath);
  var query = collectionRef.orderBy('__name__').limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, batchSize, resolve, reject);
  });
}

function deleteQueryBatch(db, query, batchSize, resolve, reject) {
  query.get()
      .then((snapshot) => {
        // When there are no documents left, we are done
        if (snapshot.size == 0) {
          return 0;
        }

        // Delete documents in a batch
        var batch = db.batch();
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        return batch.commit().then(() => {
          return snapshot.size;
        });
      })
      .then((numDeleted) => {
        if (numDeleted === 0) {
          resolve();
          return;
        }

        // Recurse on the next process tick, to avoid
        // exploding the stack.
        process.nextTick(() => {
          deleteQueryBatch(db, query, batchSize, resolve, reject);
        });
      })
      .catch(reject);
}

///////// Firebase 삭제 구문 END ////////


module.exports = app;
