//base bootstrap
var express = require('express');
var app = express();
var http = require('http').Server(app);

//routes
require('./routes.js')(app, express);

//server
http.listen(3001, '0.0.0.0')

