let dbConfig = require("../config/dbconfig");

let initialize = () => {
    dbConfig.getDB().query("create table IF NOT EXISTS roles (role_id INT auto_increment primary key, name VARCHAR(50), created_at DATETIME  default NOW())")
    //dbConfig.getDB().query('insert into roles (role_id, name) values (1 , "Super Admin")')
    dbConfig.getDB().query("create table IF NOT EXISTS users (user_id INT auto_increment primary key, name VARCHAR(50), email VARCHAR(50), password VARCHAR(50),phone VARCHAR(10),status enum('Active', 'Inactive'),role_id INT, forgot_token VARCHAR(50),forgot_otp VARCHAR(50),google_id VARCHAR(50),facebook_id VARCHAR(50),created_at DATETIME default NOW(),updated_at DATETIME default NOW() , Foreign Key (role_id) REFERENCES roles(role_id) )");
    

}

module.exports = {
    initialize: initialize
}