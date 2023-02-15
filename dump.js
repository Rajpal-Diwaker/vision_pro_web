import mysqldump from 'mysqldump'
const config = require("./config/config.js").config
const { host, user, password } = config.DB_URL

mysqldump({
    connection: {
        host: host,
        user: user,
        password: password,
        database: database,
    },
    dumpToFile: './dump.sql'
})