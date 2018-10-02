var express = require('express');
var router = express.Router();
var db = require('../config/db');


/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});


//최초등록

module.exports = router;
