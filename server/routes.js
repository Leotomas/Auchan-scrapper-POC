module.exports = function(app, express) {
    var bootstrap = require('./app/middlewares/bootstrap.js');

    //static route
    app.use(express.static('public'));

    //routes
    app.get('/', function(req, res) {
        res.send('hello world');
    });
};
