var mysql = require('../config/mysql.js');
var migration = {};

migration.migrate = function() {
    mysql.query('SELECT * FROM teams', function(err){
        if (err) {
            mysql.query('CREATE TABLE teams (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100), band_date DATE, disband_date DATE, created_at DATETIME, modified_at DATETIME)');
        }
    });

    mysql.query('SELECT * FROM games', function(err){
        if (err) {
            mysql.query('CREATE TABLE games (id INT PRIMARY KEY AUTO_INCREMENT, lounge_id INT, hltv_id INT, team_0 INT, team_1 INT, odds_0 INT, odds_1 INT, winner INT, best_of VARCHAR(100), items_placed INT, relative_time VARCHAR(100), created_at DATE)');
        }
    });

    mysql.query('SELECT * FROM active_games', function(err){
        if (err) {
            mysql.query('CREATE TABLE active_games (id INT PRIMARY KEY AUTO_INCREMENT, lounge_id INT, hltv_id INT, team_0 INT, team_1 INT, odds_0 INT, odds_1 INT, winner INT, best_of VARCHAR(100), items_placed INT, relative_time VARCHAR(100), has_started TINYINT, rescheduled TINYINT,  created_at DATE)');
        }
    });
};


migration.drop =  function() {
    mysql.query('DROP TABLE teams');
    mysql.query('DROP TABLE games');
    mysql.query('DROP TABLE active_games');
};

module.exports = migration;

