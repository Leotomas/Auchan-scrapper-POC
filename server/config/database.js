var sequelize = new Sequelize('cooklist', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
});


//abbrev sq
module.exports = sequelize;


