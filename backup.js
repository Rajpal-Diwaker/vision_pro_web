var mysqldump = require('mysqldump');
var cron = require('node-cron');

cron.schedule('59 23 ***', () => {
mysqldump({
connection: {
host: config.DB_URL.host,
user: config.DB_URL.user,
password: config.DB_URL.password,
database: config.DB_URL.database,
},
dumpToFile: './dump.sql',
})

});