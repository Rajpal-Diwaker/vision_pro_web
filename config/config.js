let environment = require('./environment').environment;
let serverURLs = require("./credential").serverURLs;

const today = new Date();
const expirationDate = new Date(today);
expirationDate.setDate(today.getDate() + 60);

let config = {
    secret: 'VISIONPRO_TECHUGO',
    tokenLife : parseInt(expirationDate.getTime() / 1000, 10) ,
    "DB_URL": {
        "host": `${serverURLs[environment].MYSQL_HOST}`,
        "user": `${serverURLs[environment].MYSQL_USER}`,
        "password": `${serverURLs[environment].MYSQL_PASSWORD}`,
        "database": `${serverURLs[environment].MYSQL_DATABASE}`
    },
    "EMAIL_CONFIG": {
        "host": `${serverURLs[environment].EMAIL_HOST}`,
        "port": `${serverURLs[environment].EMAIL_PORT}`,
        "secure": `${serverURLs[environment].EMAIL_SECURE}`,
        "auth": {
            "user": `${serverURLs[environment].EMAIL_USER}`,
            "pass": `${serverURLs[environment].EMAIL_PASS}`,
        }
    },
    "NODE_SERVER_PORT": {
        "port": `${serverURLs[environment].NODE_SERVER_PORT}`
    },
    "NODE_SERVER_URL": {
        "url": `${serverURLs[environment].NODE_SERVER}`
    },
    "WEB_URL": "https://vrp.metatronix.io/v1",
    "WEB_URL_OTHER": "https://vrp.metatronix.io:"+serverURLs[environment].NODE_SERVER_PORT
};


module.exports = {
    config: config
};
