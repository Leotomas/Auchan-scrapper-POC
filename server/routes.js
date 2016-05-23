module.exports = function(app, express) {
    //static route
    app.use(express.static('public'));

    //routes
    app.get('/', function(req, res) {
        res.send('hello world');
    });

    app.get('/auchan', function(req, res) {
        var auchanScrapper = require('./app/repositories/SupermarketScrappers/Auchan/AuchanDirect-base.js');
        res.send(auchanScrapper.scrapAll());
    });
};
