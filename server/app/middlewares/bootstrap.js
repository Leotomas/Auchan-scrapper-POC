var mysql = require('./../../database/mysql.js');
var imp = require('../repositories/DataImporter/import.js');
var bt = {};

bt.boot = function() {
    mysql.query('SELECT * from teams', function(err, rows){
        if (err) {
            imp.bootstrap();
        }
    });
};


module.exports = bt;
