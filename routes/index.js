var express = require('express');
//var fs = require('fs');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  /*
  fs.readFile('./views/index.html', function (error, data) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
  //res.render('index', { title: 'Express' });
*/
});

module.exports = router;
