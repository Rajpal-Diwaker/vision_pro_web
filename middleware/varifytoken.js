const jwt = require('jsonwebtoken');
const config = require('../config/config').config;
const auth = {
    verifyToken: (req, res, next) => {
        // console.log("req.headers.token-=========>>>>", req.headers.accesstoken , req.body) 
        if (!req.headers.accesstoken || req.headers.accesstoken=="" || req.headers.accesstoken=="") {
            // console.log("token not verified" ,req.headers.accessToken)
           res.send({"statusCode":"401","statusMessage":"provide access token "})
        }
        jwt.verify(req.headers.accesstoken, config.secret, (err, decoded) => {
             console.log("Token",err, decoded)
            if (err) {
                res.send({"statusCode":"501","statusMessage":"access token related error","error":err})
            } else {
                // console.log("fdhfd")
                next();
            }
        })
    }
};



module.exports = auth;