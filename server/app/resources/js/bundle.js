//Vue
var app = {};
app.vue = require('vue');
app.vue.config.delimiters = ['[[', ']]'];

//socket.io
var io = require('socket.io-client');
var socket = io();

//pages
require('./pages/results.js')(socket, app.vue);

//end
module.exports = app;
