//base bootstrap
var express = require('express');
var app = express();
var http = require('http').Server(app);
var base_url =  'http://cooklist.local:3000/';

//routes
require('./routes.js')(app, express);

//db
require('./config/mysql.js');

//server
http.listen(3000, '0.0.0.0');

