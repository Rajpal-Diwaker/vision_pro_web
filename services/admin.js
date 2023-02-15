/*
 * @Author: Ankit Kumar
 * @Date: November 05, 2018
 * @Last Modified by: Ankit kumar
 * @Last Modified On: December 06, 2018
 */


let async = require('async'),
    queryString = require('querystring'),
    jwt = require('jsonwebtoken');


let util = require('../utilities/utils'),
    config = require('../config/config').config,
    userDAO = require('../dao/user'),
    fileExtension = require('file-extension'),
    multer = require('multer');



/* signup API */
let signup = (data, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            if (!data.email || !data.name) {
                cb(null, {
                    "statusCode": util.statusCode.BAD_REQUEST,
                    "statusMessage": util.statusMessage.PARAMS_MISSING
                })
                return;
            }
            var criteria = {
                email: data.email
            }
            userDAO.getUsers(criteria, (err, dbData) => {

                if (err) {
                    console.log("USER SERVICE : 36 ", err.code, err.sqlMessage)
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                } else {

                    if (dbData && dbData.length > 0) {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    } else {

                        let criteria2 = {
                            name: data.name
                        }
                        userDAO.getUsers(criteria2, (err, dbData2) => {
                            if (dbData2 && dbData2.length > 0) {
                                cb(null, {
                                    "statusCode": util.statusCode.BAD_REQUEST,
                                    "statusMessage": util.statusMessage.USERNAME
                                });
                                return;
                            } else {
                                // proceed for signp.....
                                cb(null, {});
                            }
                        })
                    }
                }
            });
        },
        createUserinDB: ['checkUserExistsinDB', (cb, functionData) => {
            if (functionData && functionData.checkUserExistsinDB && functionData.checkUserExistsinDB.statusCode) {
                cb(null, functionData.checkUserExistsinDB);
                return;
            }

            let UserData = {
                "name": data.name,
                "password": util.bcriptPwd(data.password),
                "email": data.email,
                "forgotToken": data.forgotToken ? data.forgotToken : '',
                "forgotOTP": data.forgotOTP ? data.forgotOTP : '',
                "role_id": 3
            }
            userDAO.createUser(UserData, (err, dbData) => {
                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    });
                    return;
                }

                let criteria = {
                    email: data.email
                }
                userDAO.getUsers(criteria, (err, dbData) => {
                    if (err) {
                        cb(null, {
                            "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                            "statusMessage": util.statusMessage.DB_ERROR
                        })
                        return;
                    }
                    dataToSet = {
                        "userId": dbData[0].userId
                    }
                    userDAO.createUserInfo(dataToSet, (err, dbData) => {
                        cb(null)
                    });
                    if (dbData && dbData.length) {
                        let obj = {};
                        obj.userName = dbData[0].userName;
                        obj.email = dbData[0].email;
                        obj.fullName = dbData[0].fullName;
                        obj.facebookId = dbData[0].facebookId;
                        obj.googleId = dbData[0].googleId;
                        obj.forgotToken = dbData[0].forgotToken;
                        obj.forgotOTP = dbData[0].forgotOTP;
                        const token = jwt.sign({
                            id: dbData[0].userId
                        }, config.secret, {})
                        obj.token = token;
                        cb(null, {
                            "statusCode": util.statusCode.OK,
                            "statusMessage": util.statusMessage.USER_ADDED,
                            "result": obj
                        });
                    }

                });
            });
        }],

    }, (err, response) => {
        callback(response.createUserinDB);
    });
}

/*  Login API */
let login = (data, callback) => {
    async.auto({
        checkUserExistsinDB: async (cb) => {
            if (!data.email && !data.password) {
                cb(null, {
                    "statusCode": util.statusCode.BAD_REQUEST,
                    "statusMessage": util.statusMessage.PARAMS_MISSING
                })
                return;
            }
            let criteria = {
                email: data.email,
                password: util.bcriptPwd(data.password),
                roleId: 3,
                roleIdOther: 5
            }

            const users = await new Promise((resolve, reject) => {
                userDAO.checkUser(criteria, (err11, dbData11) => {
                  if(err11) reject(err)
                  resolve(dbData11)
                })
              })
            
              if (users.length == 0) {
                cb(null, {
                  statusCode: util.statusCode.FOUR_ZERO_ONE,
                  statusMessage: util.statusMessage.USER_CHECK
                });
                return
              }
      
              var check = util.bcriptComparePwd(data.password, users[0].password)
      
              if(!check){
                // password does not matched
                cb(null, {
                  statusCode: util.statusCode.BAD_REQUEST,
                  statusMessage: util.statusMessage.INCORRECT_CREDENTIALS
                });
                return
              }

                    const { userId, roleId, orgId } = users[0]

                    const token = jwt.sign({
                        uid: userId,
                        roleId: roleId,
                        orgId: orgId
                    }, config.secret, {
                        expiresIn: config.tokenLife
                    })

                    users[0].token = token

                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": util.statusMessage.LOGIN_SUCCESS,
                        "result": users[0]
                    });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/*  iisationLogin API */
let organisationLogin = (data, callback) => {
    async.auto({
        checkUserExistsinDB: async (cb) => {
            if (!data.email && !data.password) {
                cb(null, {
                    "statusCode": util.statusCode.BAD_REQUEST,
                    "statusMessage": util.statusMessage.PARAMS_MISSING
                })
                return;
            }
            let criteria = {
                email: data.email
            }

            const users = await new Promise((resolve, reject) => {
                userDAO.organisationLogin(criteria, (err11, dbData11) => {
                  if(err11) reject(err)
                  resolve(dbData11)
                })
              })
            
              if (users.length == 0) {
                cb(null, {
                  statusCode: util.statusCode.FOUR_ZERO_ONE,
                  statusMessage: util.statusMessage.USER_CHECK
                });
                return
              }
      
              var check = util.bcriptComparePwd(data.password, users[0].password)
      
              if(!check){
                // password does not matched
                cb(null, {
                  statusCode: util.statusCode.BAD_REQUEST,
                  statusMessage: util.statusMessage.INCORRECT_CREDENTIALS
                });
                return
              }
              const {orgId,
                name,
                orgEmail,
                address,
                experts,
                technician,
                smartGlass,
                image,
                expertsLimit,
                createdAt,
                gpsState} = users[0]

                const obj = { name,
                    orgEmail,
                    address,
                    experts,
                    technician,
                    smartGlass,
                    image,
                    expertsLimit,
                    createdAt,
                    gpsState}

                    const orgIDD = orgId
                    userDAO.checkStatus({ orgId: orgIDD }, (err1, dbData1) => {
                        if (dbData1 && dbData1[0] && dbData1[0].status.toLowerCase() == 'inactive') {
                            cb(null, {
                                statusCode: 201,
                                statusMessage: "Please contact your admin."
                            });
                            return
                        }
                        const token = jwt.sign({
                            uid: orgId,
                            roleId: 2,
                            orgId: orgId
                        }, config.secret, {
                            expiresIn: config.tokenLife
                        })
                        
                        obj.token = token

                        cb(null, {
                            "statusCode": util.statusCode.OK,
                            "statusMessage": util.statusMessage.LOGIN_SUCCESS,
                            "result": obj
                        });
                    });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Get Organisations API */
let getOrganisations = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            let criteria = {}
            userDAO.getOrganisations(criteria, (err, dbData) => {
                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                }
                if (dbData && dbData.length) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Fetch data Successfully",
                        "result": dbData
                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "No data Found."
                    });
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Get Organisations API */
let getOrganisationsById = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            util.jwtDecode(headers.accesstoken, (err, decode) => {

                console.log(decode)

                if(decode.orgId)
                {
                    data.orgId = decode.orgId
                }
            
                let criteria = {}
                criteria.orgId = data.orgId
                
                userDAO.getOrganisationsById(criteria, (err, dbData) => {
                    if (err) {
                        cb(null, {
                            "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                            "statusMessage": util.statusMessage.DB_ERROR
                        })
                    }

                    if (dbData && dbData.length) {
                        cb(null, {
                            "statusCode": util.statusCode.OK,
                            "statusMessage": "Fetch data Successfully",
                            "result": dbData
                        });

                    } else {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": "No data Found."
                        });
                    }
                });
            })
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Get OrganisationsName API */
let getOrganisationsName = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {

            let criteria = {}
            userDAO.getOrganisationsName(criteria, (err, dbData) => {

                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                }
                //console.log(dbData)
                if (dbData && dbData.length) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Fetch data Successfully",
                        "result": dbData
                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "No data Found."
                    });
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Add Organisations API */
let organisations = (data, headers, files, callback) => {

    let image;
    if (files && files.image && files.image[0].filename && files.image[0].size > 0) {
        image = files.image[0].filename;
    }

    if (image && image != " ") {
        data['image'] = image
    }

    async.auto({
        checkUserExistsinDB: (cb) => {
            let password = util.generatePassword(8);
            let passwordMail = password;
            data['password'] = util.bcriptPwd(password)

            userDAO.organisations(data, async (err, dbData) => {
               
                if(!dbData){
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
                data['orgId'] = dbData.insertId;
                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    }

                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }
                if (dbData && dbData.affectedRows) {

                    let forgotToken = util.generateToken();

                    let OTP = Math.floor(100000 + Math.random() * 900000);
        
                    let dataToSet = {
                      orgId: data['orgId'],
                      forgotToken: forgotToken,
                      forgotOTP: OTP
                    };
                    await new Promise((resolve, reject) => {
                        userDAO.updateOrganisations(dataToSet, (err, dbData) => {
                            resolve("success")
                        });
                    })

                    const token = jwt.sign(
                        {
                          uid: data['orgId']
                        },
                        config.secret,
                        {
                          expiresIn: config.tokenLife
                        }
                      );

                    util.sendEmailOrg1({
                        "email": data.orgEmail,
                        "password": passwordMail,
                        "forgotToken": forgotToken,
                        "OTP": OTP,
                        "token": token,
                        "webURL": util.webURL
                    });
                    
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",
                        "result": dbData.insertId
                    });
                    return;
                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}


/** Update Organisations API */
let updateOrganisations = (data, headers, files, callback) => {

    let image;
    if (files && files.image && files.image[0].filename && files.image[0].size > 0) {
        image = files.image[0].filename;
    }

    if (image && image != " ") {
        data['image'] = image
    }
    
    async.auto({
        checkUserExistsinDB: (cb) => {

            let criteria = {}
            userDAO.updateOrganisations(data, (err, dbData) => {

                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    }

                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }

                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",

                    });
                    return;

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** delete Organisations API */
let deleteOrganisations = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            userDAO.deleteOrganisations(data, (err, dbData) => {
                if (err) {
                    console.log(err, "err deleteOrganisations")
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }
                cb(null, {
                    "statusCode": util.statusCode.OK,
                    "statusMessage": "Success",

                });
                return;
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/**Organisation update API */
let orgPicUpdate = (data, headers, files, callback) => {

    async.auto({
        checkUserExistsinDB: (cb) => {

            let dataToSet = {}

            if (data.orgId) {
                dataToSet.orgId = data.orgId
            }

            let image;
            if (files && files.image && files.image[0].filename && files.image[0].size > 0) {
                image = files.image[0].filename;
            }

            if (image && image != " ") {
                dataToSet.image = image
            }

            cb(null, {
                "statusCode": util.statusCode.OK,
                "message": "Successfull",
                "result": dataToSet
            });
        }

    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/* signup API */
let adminSignup = (data, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            if (!data.email || !data.password) {
                cb(null, {
                    "statusCode": util.statusCode.BAD_REQUEST,
                    "statusMessage": util.statusMessage.PARAMS_MISSING
                })
                return;
            }
            var criteria = {
                email: data.email
            }
            userDAO.getUsers(criteria, (err, dbData) => {
                if (err) {
                    console.log("USER SERVICE : 356 ", err.code, err.sqlMessage)
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                } else {

                    if (dbData && dbData.length > 0) {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    } else {
                        cb(null);
                    }
                }
            });
        },
        createUserinDB: ['checkUserExistsinDB', (cb, functionData) => {

            if (functionData && functionData.checkUserExistsinDB && functionData.checkUserExistsinDB.statusCode) {
                cb(null, functionData.checkUserExistsinDB);
                return;
            }

            let UserData = {
                "password": util.bcriptPwd(data.password),
                "email": data.email,
                "orgId": data.orgId,
                "roleId": 5,
                "designation": "admin",
                "location": "",
                "domainArea": "",
                "userImage": "",
                "empId": "",
                "passcode": "",
                "forgotOTP": "",
                "expireCode": ""
            }

            userDAO.createUser(UserData, (err, dbData) => {
                if (err) {
                    console.log("USER SERVICE : 92 ", err.code, err.sqlMessage)
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    });
                    return;
                }
                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": util.statusMessage.USER_ADDED,
                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                }
            });
        }]

    }, (err, response) => {
        //console.log(response)
        callback(response.createUserinDB);
    });
}

/** Get OrganisationsName API */
let getAdmin = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {

            let criteria = {
                roleId: 5
            }
            userDAO.getAdmin(criteria, (err, dbData) => {

                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                }
                
                if (dbData && dbData.length) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Fetch data Successfully",
                        "result": dbData
                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "No data Found."
                    });
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** delete OrganisationsName API */
let deleteUser = (data, headers, callback) => {
    async.auto({

        checkUserExistsinDB: (cb) => {

            if (!data.userId) {
                cb(null, {
                    "statusCode": util.statusCode.BAD_REQUEST,
                    "statusMessage": util.statusMessage.PARAMS_MISSING
                })
                return;
            }

            let criteria = {
                userId: data.userId
            }
            userDAO.deleteUser(criteria, (err, dbData) => {

                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                }
                // console.log(dbData)
                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Deleted Successfully",

                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Deletion Failed."
                    });
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** delete galss API */
let deleteGlass = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            // console.log(data) 
            userDAO.deleteGlass(data, (err, dbData) => {
                //             console.log("ANKIT",err,dbData)
                if (err) {

                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }
                cb(null, {
                    "statusCode": util.statusCode.OK,
                    "statusMessage": "Success",

                });
                return;
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** delete galss API */
let getGlass = (data, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            let orgId
            util.jwtDecode(headers.accesstoken, (err, decode) => {
                orgId = decode.orgId
            })

            criteria = {
                orgId: orgId,
                isAllocated: 'False'
            }

            if (data.glassId) {
                criteria.id = data.glassId
            }
            userDAO.getGlass(criteria, (err, dbData) => {
                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }
                if (dbData && dbData.length) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",
                        "result": dbData
                    });
                    return;
                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "No record Found."
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Active/Inactive Organisations API */
let setStatusOrganisations = (data, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {

            let criteria = {}
            userDAO.setStatusOrganisations(data, (err, dbData) => {

                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    }

                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }

                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",

                    });
                    return;

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

/** Get Reports API */
let getReports = (status, headers, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            userDAO.getReports(status, (err, dbData) => {
                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                }
                if (dbData) {
                    const { organisations, smart_glasses } = dbData
                    const organizations_total = organisations.length;
                    const smart_glasses_total = smart_glasses.length;
                    let organisations_count = 0
                    let smart_glasses_count = 0
                    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    let res = {}
                    let res_org_year = {}
                    let res_org_day = {}

                    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                    month.forEach(month => res[month] = 0)
                    organisations.forEach(obj => {
                        if (obj.status == 'Active')
                            organisations_count++

                        const date_obj = new Date(obj.createdAt)
                        const month_name = month[date_obj.getMonth()]
                        const full_year = date_obj.getFullYear()
                        res[month_name] = (res[month_name]) ? ++res[month_name] : 1
                        res_org_year[full_year] = (res_org_year[full_year]) ? ++res_org_year[full_year] : 1

                        const day = date_obj.getDay()
                        res_org_day[day] = (res_org_day[day]) ? ++res_org_day[day] : 1;
                    })
                    let res_glass = {}
                    let res_glass_year = {}
                    let res_glass_day = {}
                    month.forEach(month => res_glass[month] = 0)
                    smart_glasses.forEach(obj => {
                        if (obj.isAllocated.toLowerCase() == 'true') {
                            smart_glasses_count++
                        }
                        let date_obj = new Date(obj.createdAt)
                        const month_name = month[date_obj.getMonth()]
                        const full_year = date_obj.getFullYear()
                        res_glass[month_name] = (res_glass[month_name]) ? ++res_glass[month_name] : 1
                        res_glass_year[full_year] = (res_glass_year[full_year]) ? ++res_glass_year[full_year] : 1

                        const day = date_obj.getDay()
                        res_glass_day[day] = (res_glass_day[day]) ? ++res_glass_day[day] : 1;
                    })

                    let org_per = (organisations_count / organizations_total) * 100
                    let glasses_per = (smart_glasses_count / smart_glasses_total) * 100
                    org_per = Math.round(org_per * 100) / 100
                    glasses_per = Math.round(glasses_per * 100) / 100

                    let result = {
                        stats: { org_per: org_per, glasses_per: glasses_per },
                        monthly: { org: res, glass: res_glass },
                        yearly: { org_year: res_org_year, glass_year: res_glass_year },
                        day: { org_day: res_org_day, glass_day: res_glass_day }
                    }

                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Fetch data Successfully",
                        "result": result
                    });

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "No data Found."
                    });
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}


let sendNotif = (data, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            userDAO.sendNotif(data, (err, dbData) => {
                if (err) {
                    if (err.code == 'ER_DUP_ENTRY') {
                        cb(null, {
                            "statusCode": util.statusCode.BAD_REQUEST,
                            "statusMessage": util.statusMessage.EMAIL_EXIST
                        });
                        return;
                    }

                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }

                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",

                    });
                    return;

                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

let content = (data, callback) => {
    async.auto({
        checkUserExistsinDB: (cb) => {
            userDAO.content(data, (err, dbData) => {
                if (err) {
                    cb(null, {
                        "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
                        "statusMessage": util.statusMessage.DB_ERROR
                    })
                    return;
                }

                if (dbData && dbData.affectedRows) {
                    cb(null, {
                        "statusCode": util.statusCode.OK,
                        "statusMessage": "Success",
                    });
                    return;
                } else {
                    cb(null, {
                        "statusCode": util.statusCode.BAD_REQUEST,
                        "statusMessage": "Insertion Failed"
                    });
                    return;
                }
            });
        }
    }, (err, response) => {
        callback(response.checkUserExistsinDB);
    })
}

module.exports = {
    signup: signup,
    login: login,
    getOrganisations: getOrganisations,
    organisations: organisations,
    orgPicUpdate: orgPicUpdate,
    adminSignup: adminSignup,
    getOrganisationsName: getOrganisationsName,
    getAdmin: getAdmin,
    getOrganisationsById: getOrganisationsById,
    deleteUser: deleteUser,
    updateOrganisations: updateOrganisations,
    deleteOrganisations: deleteOrganisations,
    deleteGlass: deleteGlass,
    organisationLogin: organisationLogin,
    getGlass: getGlass,
    setStatusOrganisations: setStatusOrganisations,
    getReports: getReports,
    sendNotif: sendNotif,
    content: content
};