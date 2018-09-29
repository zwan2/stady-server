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
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/exams', require('./routes/exams'));
app.use('/stopwatch', require('./routes/stopwatch'));
app.use('/groups', require('./routes/groups'));
app.use('/statistics', require('./routes/statistics'));


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


//먼저 join 후 (start, stop)이 반복됨.
io.sockets.on('connection', function (socket) {

  //1. JOIN data.roomname
  socket.on('join', function (data) {
    console.log(data);
    // socket join 을 합니다.
    socket.join(data.romname);
    //구성원에게 알림.
    io.sockets.in(data.roomname).emit('join', data.userid);
  });

  // 2. START OR STOP MESSAGE EMIT
  socket.on('message', function (message) { 
    io.sockets.in(message.roomname).emit('message', message.message);
  });


  socket.on('leave', function (data) {
    socket.leave(data.roomname);
    io.sockets.in(data.roomname).emit('user left', data.userid);
  });
});


http.listen(3000, function () {
  console.log('server running');
});


//GLOBAL
global.isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/users/');
};

module.exports = app;
