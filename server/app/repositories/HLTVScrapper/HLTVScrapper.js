var cheerio = require('cheerio');
var request = require('request');
var mysql = require('./../../../config/mysql.js');
var _ = require('underscore');
var moment = require('moment');
var tor = require('tor-request');

var hltv = {};

hltv.scrap = function(gameId) {
    request('http://www.hltv.org/?pageid=188&matchid='+gameId, function(error, response, html){
        if (error) {
            throw error;
        }
        var ret = {};
        var $   = cheerio.load(html);
        $('div.covSmallHeadline').each(function(i, e) {
            switch (i) {
                case 3:
                    ret.map = $(this).text();
                    break;
                case 5:
                    ret.event = $('span', this).attr('title');
                    break;
                case 9:
                    var score = $(this).text();
                    score = score.substring(0, score.indexOf(' '));

                    var divider = score.indexOf(':');

                    ret.homeScore = parseInt(score.substring(0, divider), 10);
                    ret.awayScore = parseInt(score.substring(divider + 1), 10);
                    break;
                case 11:
                    ret.home = $(this).text().trim();
                    break;
                case 13:
                    ret.away = $(this).text().trim();
                    break;
            }
        });
        console.log(ret);
    });
};

module.exports = hltv;
