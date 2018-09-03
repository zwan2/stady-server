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

/*
var server = require('http').createServer(app);
var io = require('socket.io')(server);
*/

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



io.on('connection', function (socket) {
  console.log('socket connected!!!');
  socket.emit('news', {
    hello: 'world'
  });
   socket.on('my other event', function (data) {
     console.log(data);
   });
  
});




http.listen(3000, function () {
  console.log('server running');
});



module.exports = app;
