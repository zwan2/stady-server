var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


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
app.use('/user', require('./routes/users'));
app.use('/stopwatch', require('./routes/stopwatch'));
app.use('/groups', require('./routes/groups'));


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


/*
io.on('connection', function (socket) {
  console.log('socket connected!!!');
 
  //1. start, end
  socket.on('sendMessage', function(data) {
    io.sockets.to('room' + data.roomId).emit('send:message', data.message)
  });


  //2. join
  socket.on('join:room', function(data) {
    socket.join('room'+data.roomId);
  });

});
*/

io.sockets.on('connection', function (socket) {

  // room join
  // 사용자 접속 시 room join 및 접속한 사용자를 room 참여 인원들에게 알립니다.
  socket.on('join', function (data) {
    console.log(data);
    
    // socket join 을 합니다.
    socket.join(data.roomname);
    /*
    socket.set('room', data.roomname);
    // room join 인원들에게 메시지를 보냅니다.
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('join', data.userid);
    });
    */
    io.sockets.in(data.roomname).emit('join', data.userid);
  });

  // message
  socket.on('message', function (message) {
    /*
    socket.get('room', function (error, room) {
      io.sockets.in(room).emit('message', message);
    });
    */
    io.sockets.in(message.roomname).emit('message', message.message);
  });
  socket.on('disconnect', function () {});
});


http.listen(3000, function () {
  console.log('server running');
});



module.exports = app;
