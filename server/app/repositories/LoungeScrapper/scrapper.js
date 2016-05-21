//deps
var cheerio  = require('cheerio');
var request  = require('request');
var mysql    = require('./../../../config/mysql.js');
var promise  = require('bluebird');
var _        = require('underscore');
var moment   = require('moment');
var importer = require('./../DataImporter/import.js');

//init
var lounge = {};

//vars
lounge.url = 'http://csgolounge.com';
lounge.matches = [];
lounge.boundaries = {
    min : 0,
    max : 0,
};
lounge.tries = 0;
lounge.scouting_has_ended = false;


//class
/**
* La fonction qui lance la récupération des données
* depuis csgolounge
* on récupère graduellement les derniers matchs
*/
lounge.import = function() {
    console.log('import ?');
    lounge.getLatestDbLoungeId(function(c_id){
        lounge.getLatestLoungeMatchId(c_id, function(i){
            lounge.boundaries = {
                min : c_id,
                max : i
            };

            console.log('BOUNDARIES : ------');
            console.log(lounge.boundaries);
            for (var j = lounge.boundaries.min; j <= lounge.boundaries.max; j++) {
                lounge.getMatch(j);
            }
        });
    });
};

/**
* Determine le dernier match ID à aller récupérer sur csgolounge
*/
lounge.getLatestLoungeMatchId =  function(min, callback) {
    lounge.scouting = {
        hops : 75,
        tries : 0,
        reports: {
            success : 0,
            failure : 0,
        }
    };
    for (var i = min; i <= min + lounge.scouting.hops;i++) {
        console.log(min+'->'+i+' sent');
        tor.request(lounge.url + '/match?m='+i, function(error, response, html){
            if (error || !html){
                console.log(html, i);
            } else if (lounge.scouting_has_ended) {
                //requests that come back with errors or too late
                return false;
            } else {
                var $ = cheerio.load(html);
                $error = $('main section h1').first().text();
                if (response.statusCode == 200 && $error != '404') {
                    lounge.scouting.reports.succes++;
                } else {
                    lounge.scouting.reports.failure++;
                }

                lounge.scouting.tries++;
                console.log(lounge.scouting.tries+'/'+lounge.scouting.hops+' received');
                if (lounge.scouting.tries == lounge.scouting.hops) {
                    //last request received
                    if (lounge.scouting.reports.failure != lounge.scouting.hops) {
                        console.log('again');
                        lounge.getLatestLoungeMatchId(min+lounge.scouting.hops, callback);
                    } else {
                        console.log('stop');
                        lounge.boundaries.max = i;
                        callback(i);
                    }
                }
            }
        });
    }
};

/*
* Recupère le dernier matchId de la bdd
* Ou default sur une valeur
*/
lounge.getLatestDbLoungeId = function(callback) {
    mysql.query('SELECT id from games', function(err, rows) {
        var c_id = 7000; //
        for (var i in rows) {
            if (rows[i].id > 0) {
                c_id = id;
            }
        }
        lounge.boundaries.min = c_id;
        callback(c_id);
    });
};



/**
* Récupère les données pleines d'un match et les renvoie à une callback
*/
lounge.getMatch = function(matchId, container){
    request(lounge.url + '/match?m=' + matchId, function(error, response, html){
        if (error || !html) {
            console.log('Scrapping Error ---------------');
            console.log(request.statusCode);
            console.log(request.headers);
            // throw error;
        }
        else {
            console.log('scrapping page '+matchId);
            var $         = cheerio.load(html);
            $teams        = $('main section').first().find('a');
            $headers      = $('main section').first().find('.half');
            relative_date = $headers.eq(0).text();
            best_of       = $headers.eq(1).text();
            game_time     = $headers.eq(2).text();
            $team1 = $teams.eq(0);
            $team2 = $teams.eq(1);
            team1Name = $team1.find('b').text();
            team2Name = $team2.find('b').text();
            team1Odds = $team1.find('i').text();
            team2Odds = $team2.find('i').text();
            var winner;
            if(team1Name.indexOf("(win)") > -1){
                team1Name = team1Name.replace(' (win)', '');
                winner = 0;
            }else if(team2Name.indexOf("(win)") > -1){
                team2Name = team2Name.replace(' (win)', '');
                winner = 1;
            }
            var team1 = {
                name: team1Name,
                odds : lounge.formatOdds(team1Odds)
            };
            var team2 = {
                name: team2Name,
                odds : lounge.formatOdds(team2Odds)
            };
            var match           = {};
            match.winner        = winner;
            match.id            = matchId;
            match.best_of       = best_of;
            match.relative_date = relative_date;
            match.game_time     = game_time;
            match.teams         = [team1, team2];

            lounge.tries++;
            lounge.validateMatch(match, function(match){
                var set = {
                    data : JSON.stringify(match)
                };
                mysql.query('INSERT INTO raw SET?', set, function(err){
                    if (err) {
                        throw err;
                    }
                });
                // lounge.matches.push(match);
                // var l = lounge.boundaries.max - lounge.boundaries.min;
                // console.log('----'+lounge.tries +'/'+ l+'-------');
                // if (lounge.tries == lounge.boundaries.max - lounge.boundaries.min) {
                //     lounge.insertRaw(lounge.matches);
                // }
            });
        }
    });
};

/**
* Insertion des données au format JSON dans la table raw
* Mass insert
*/
lounge.insertRaw = function(matches) {
    console.log('-----------------------DB INSERT GO----------------');
    console.log('----------'+matches.length+' to INSERT ------------');
    var o = [];
    for (var i in matches) {
        o.push([JSON.stringify(matches[i])]);
    }
    console.log(matches.length);
    mysql.query('INSERT INTO raw (data) VALUES?', [o], function(err){
        if (err) {
            throw err;
        }
        //
        console.log('end of script');
    });
};


/**
* validates the data extracted from csgolounge HTML
*/
lounge.validateMatch = function(match, callback) {
    if (match.winner != 1 && match.winner !== 0) {
        console.log('no winner');
        return false;
    }
    for (var i in match.teams) {
        var team = match.teams[i];
        if(team.odds == 100 || team.odds === 0) {
            console.log('bad odds');
            return false;
        }
        if (team.name === '' || !team.name) {
            console.log('empty team name');
            return false;
        }
    }
    callback(match);
};

/**
* Format the odds to be parsed in numeric value
*/
lounge.formatOdds =  function(odds) {
    return parseInt(odds.slice(0, -1));
};


lounge.importTeams = function() {
    mysql.query('SELECT data FROM raw', function(err, rows){
        if (err) {
            throw err;
        }

        var parsed = [];
        for (var i in rows) {
            parsed.push(JSON.parse(rows[i].data));
        }

        var teams = [];
        for (var j in parsed) {
            for (var k in parsed[j].teams) {
                var team = parsed[j].teams[k];
                teams.push(team.name);
            }
        }

        teams = _.unique(teams);
        i_teams = [];
        for (var k in teams) {
            i_teams.push([teams[k]]);
        }
        mysql.query('INSERT INTO teams (name) VALUES?', [i_teams], function(err) {
            if (err) {
                throw err;
            }
            lounge.importGames(parsed, teams);
        });
    });
};

lounge.importGames = function(data, teams) {
    for (var i in data) {
        var teams_db = [
            teams.indexOf(data[i].teams[0].name) + 1,
            teams.indexOf(data[i].teams[1].name) + 1
        ];
        var winner;
        if (data[i].winner) { //1
            winner = teams_db[1]
        } else {
            winner = teams_db[0]
        }
        var bo = data[i].best_of

        insert =  {
            team_0 : teams_db[0],
            team_1 : teams_db[1],
            odds_0 : data[i].teams[0].odds,
            odds_1 : data[i].teams[1].odds,
            winner : winner,
            best_of : data[i].best_of,
            relative_time: data[i].relative_date,
            created_at : moment().format('YYYY-MM-DD')
        };
        console.log(insert);

        mysql.query('INSERT INTO games SET?', insert, function(err){
            if (err) {
                throw err;
            }
        });
    }
};

lounge.getCurrentMatchs = function() {
    request('https://csgolounge.com/', function(err, response, html){
        if (err) {
            throw err;
        }
        var $ = cheerio.load(html);
        var games = [];
        $('div.matchmain').each(function(i, elem){
            var p =  {};
            //date
            var date_meta = $(this).find('.whenm').first().text();
            var date_diff = date_meta.split(' ');
            var date_ago = date_meta.match(/ago/i);
            var date_from = date_meta.match(/from/i);
            console.log(date_ago, date_from);
            if (date_ago) {
                p.date_diff = date_diff[0]+' '+date_diff[1]+' '+date_diff[2];
                p.has_started = true;
            }
            else if (date_from) {
                p.date_diff = date_diff[0]+' '+date_diff[1]+' '+date_diff[2];
                p.has_started = false;
            }

            //actif ou pas
            var rescheduled = date_meta.match(/rescheduled/i);
            if (rescheduled) {
                p.rescheduled = true;
            } else {
                p.rescheduled = false;
            }

            // p.items_placed = parseInt(metas[3].match(/[0-9]\w+/g));
            //actif ou pas
            var rescheduled = date_meta.match(/rescheduled/i);
            if (rescheduled) {
                p.rescheduled = true;
            } else {
                p.rescheduled = false;
            }

            var date = date_meta.match(/ago/i);
            if (!date) {
            } else {
                p.has_started = true;
            }

            //total bets
            p.total_bets = $(this).find('.ld-totalbets').text();
            p.event = $(this).find('.eventm').first().text();

            //match id
            var match_id_string = $(this).find('.matchleft').find('a').first().attr('href');
            p.gameId = parseInt(match_id_string.match(/[0-9]\w+/g)[0]);

            p.format = $(this).find('.format').first().text();

            var teams = [];
            $(this).find('.teamtext').each(function(i, elem){
                p['team_'+i]= $(this).find('b').first().text();
                p['odds_'+i] = $(this).find('i').first().text();
            });

            $(this).find('.team').each(function(i, elem){
                //find winner
                var win_badge = $(this).find('img');
                if (win_badge[0]) {
                    p.winner = i;
                }
            });
            games.push(p);
        });
        importer.importCurrentGames(p);
    });
};


lounge.parser = {};


module.exports = lounge;
