var tor = require('tor-request');
var request  = require('request');
var cheerio = require('cheerio');

var auchan = {};

auchan.state = {
    requests : {
        sent : 0,
        failed : 0
    }
};

auchan.scrapAll = function() {
    setTimeout(function(){
        auchan.launch();
    }, 100);
};

auchan.launch = function() {
    request('http://www.auchandirect.fr/Accueil', function(err, response, html){
        var $      = cheerio.load(html);
        var header = $('#header');
        var menus  = $('#header').find('.menu-listes');
        var links = [];
        menus.each(function(i, elem) {
            var item = $(this).find('li');
            item.each(function(i_2, elem_2) {
                if (i_2 != 1) {
                    links.push($(this).find('a').attr('href'));
                }
            });
        });

        for (var i in links) {
            auchan.state.requests.sent++;
            var link = 'http://www.auchandirect.fr'+links[i];
            console.log(link);
            request(link, function(err, response, html){
                if (err) {
                    throw err;
                }
                setTimeout(function(){
                    auchan.scrapProduits(html);
                }, 100);
            });
            //testing
            return true;
        }
        return header;
    });
};

auchan.scrapProduits = function(html) {
    $ = cheerio.load(html);
    var $produits = $('.bloc-produit-content');
    if ($produits.length == 0) {
        var failed = auchan.state.requests.failed;
        failed++;
        console.log('failed to parse product blocks');
        if (failed > 10) {
            throw 'banned from site';
        }
        return false;
    }

    var produits =[];
    console.log($produits.length+' produits trouvés');
    $produits.each(function(i, elem){
        var p = {};
        p.prix_actuel = undefined;
        p.prix_old    = undefined;
        p.prix_promo  = undefined;

         var prix = $(this).find('div.infos-produit-1').find('div');
         prix.each(function(i, elem){
            var a_class = $(this).attr('class');
            var price = $(this).text().trim();
            if (a_class == 'prix-actuel') {
                p.prix_actuel = price;
            } else if (a_class == 'prix-promo') {
                p.prix_promo = price;
            } else if (a_class == 'prix-old') {
                p.prix_old = price;
            }
         });


        p.nom         = $(this).find('div.infos-produit-2').first('a').find('h2').te;
        p.description = $(this).find('div.infos-produit-2').first('a').find('h4').eq(0).text();
        p.origine     = $(this).find('div.infos-produit-2').first('a').find('h4').eq(1).text();
        p.grammage    = $(this).find('div.infos-produit-2').first('a').first('p').text();
        p.single_page = $(this).find('a').eq(0).attr('href');
        p.image       = $(this).find('img').eq(0).attr('src');
        console.log(p);
        // var out = auchan.cleanData(p);
        // console.log(out);
    });
};


auchan.cleanData = function(obj) {
    var o = {};
    for (var i in obj) {
        var s = obj[i]
        s = s.replace(/\t/g, '').trim(); //removing tabs
        s =  s.split('\n');
        for (var j in s) {
            if (s[j] === '') {
                s.splice(j, 1);
            }
        }
        o[i] = s;
    }

    console.log(o);
    return o;
};


module.exports = auchan;
