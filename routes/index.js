var express = require('express');
var fs = require('fs');
var router = express.Router();
var path = require('path');

/* GET home page. */
/*router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  
  fs.readFile('./web/a.html', function (error, data) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
  //res.render('index', { title: 'Express' });

});


/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('landing page');
  
  res.render('landing')
});


module.exports = router;
