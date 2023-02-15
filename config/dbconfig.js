var config = require("./config").config;

var mysql = require('mysql');
var connection = mysql.createConnection({
    host: config.DB_URL.host,
    user: config.DB_URL.user,
    password: config.DB_URL.password,
    database: config.DB_URL.database,
});

connection.connect((err,data) => {
    require('../models/User').initialize();
});


let getDB = () => {
    return connection;
}

module.exports = {
    getDB: getDB
}