var Ajv = require('ajv');
var ajv = new Ajv();
var util = require("../utilities/utils")

var schema = {
    "agent": {
        "properties": {
            "about": { "type": "string" },
            "gender": { "type": "string" },
            "name": { "type": "string" },
            "email": { "type": "string" },
            "phone": { "type": "string" },
            "locations": { "type": "string" },
            "dob": { "type": "string" },
            "domainArea": { "type": "string" },
            "designation": { "type": "string" },
            "glassId": { "type": "string" }
        },
        "required": ["gender", "name", "email", "phone", "dob", "domainArea", "designation", "glassId"]
    }
}

const roles = {
    4: "agent"
}

exports.global_validator = async (req, res, cb) => {
    var valid = ajv.validate(schema[roles[req.body.roleId]], req.body);

    if (!valid) {
        obj = {
            statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
            statusMessage: ajv.errors
        }
        res.status(util.statusCode.OK).send(obj);
        return
    }

    cb(null, true)
}