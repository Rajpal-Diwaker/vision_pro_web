/*
 * @Author: Arjun Sisodia
 */

let async = require("async"),
  queryString = require("querystring"),
  jwt = require("jsonwebtoken");

let util = require("../utilities/utils"),
  config = require("../config/config").config,
  userDAO = require("../dao/user");
streams = require("../app/streams");
request = require("request");

/* signup API */
let signup = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.email || !data.name) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        var criteria = {
          email: data.email
        };
        userDAO.getUsers(criteria, (err, dbData) => {
          if (err) {
            console.log("USER SERVICE : 36 ", err.code, err.sqlMessage);
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            if (dbData && dbData.length > 0) {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: util.statusMessage.EMAIL_EXIST
              });
              return;
            } else {
              let criteria2 = {
                name: data.name
              };
              userDAO.getUsers(criteria2, (err, dbData2) => {
                if (dbData2 && dbData2.length > 0) {
                  cb(null, {
                    statusCode: util.statusCode.BAD_REQUEST,
                    statusMessage: util.statusMessage.USERNAME
                  });
                  return;
                } else {
                  // proceed for signp.....
                  cb(null, {});
                }
              });
            }
          }
        });
      },
      createUserinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (
            functionData &&
            functionData.checkUserExistsinDB &&
            functionData.checkUserExistsinDB.statusCode
          ) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }

          let UserData = {
            name: data.name,
            password: util.bcriptPwd(data.password),
            email: data.email,
            forgotToken: data.forgotToken ? data.forgotToken : "",
            forgotOTP: data.forgotOTP ? data.forgotOTP : "",
            roleId: 1
          };
          userDAO.createUser(UserData, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }

            let criteria = {
              email: data.email
            };
            userDAO.getUsers(criteria, (err, dbData) => {
              if (err) {
                cb(null, {
                  statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                  statusMessage: util.statusMessage.DB_ERROR
                });
                return;
              }
              dataToSet = {
                userId: dbData[0].userId
              };
              userDAO.createUserInfo(dataToSet, (err, dbData) => {
                cb(null);
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
                const token = jwt.sign(
                  {
                    id: dbData[0].userId
                  },
                  config.secret,
                  {}
                );
                obj.token = token;
                cb(null, {
                  statusCode: util.statusCode.OK,
                  statusMessage: util.statusMessage.USER_ADDED,
                  result: obj
                });
              }
            });
          });
        }
      ]
    },
    (err, response) => {
      callback(response.createUserinDB);
    }
  );
};

let sentQRMail = data => {
  var QRCode = require("qrcode");

  if (data.passcode) {

    const pwd = jwt.sign(
      {
        passcode: data.passcode,
        expireCode: data.expireCode
      },
      config.secret
    );
  
   data.passcode = pwd ? pwd : data.passcode
  } else {
    return
  }

  QRCode.toDataURL(
    `${config.WEB_URL_OTHER}/AndroidRTC?user=${data.email}&pass=${
    data.passcode
    }&expireCode=${data.expireCode}`,

    function (err, url) {
      var base64Data = url.replace(/^data:image\/png;base64,/, "");
      const filename = Math.floor(Date.now() / 1000) + "~QRCode.png";
      const uri =
        config.NODE_SERVER_URL.url +
        ":" +
        config.NODE_SERVER_PORT.port +
        "/qrcode/" +
        filename;

      util.sendEmailAgent({
        email: data.email,
        uri: uri,
        name: data.name ? data.name : ""
      });

      require("fs").writeFile(
        "public/qrcode/" + filename,
        base64Data,
        "base64",
        function (err) {
          console.log(err);
          require("fs").chmod("public/qrcode/" + filename, 0666, error => {
            console.log("Changed file permissions");
          });
        }
      );
    }
  );
};

/* addUser API */
let addUser = (data, headers, files, callback) => {
  let image;
  if (files && files.userImage && files.userImage[0].filename && files.userImage[0].size > 0) {
    image = files.userImage[0].filename;
  }

  if (image && image != " ") {
    data['userImage'] = image
  }

  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.email) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        var criteria = {
          email: data.email
        };
        userDAO.getUsers(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            if (dbData && dbData.length > 0) {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: util.statusMessage.EMAIL_EXIST
              });
              return;
            } else {
              cb(null, {});
            }
          }
        });
      },
      createUserinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (
            functionData &&
            functionData.checkUserExistsinDB &&
            functionData.checkUserExistsinDB.statusCode
          ) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }
          let password = util.generatePassword(8);
          let passwordMail = password;
          data.password = util.bcriptPwd(password);
          let orgId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            orgId = decode.orgId;

            let expireCode = util.generatePassword(16);

            let UserData = {
              name: data.name,
              password: data.password,
              email: data.email,
              roleId: data.roleId,
              gender: data.gender,
              phone: data.phone,
              location: data.location,
              dob: data.dob,
              orgId: orgId,
              about: data.about,
              domainArea: data.domainArea,
              designation: data.designation,
              glassId: data.glassId ? data.glassId : 0,
              empId: data.empId ? data.empId : "",
              passcode: password,
              expireCode: expireCode,
              userImage: data.userImage ? data.userImage : ""
            };

            data["expireCode"] = expireCode;
            data["passcode"] = password

            userDAO.checkLimit(UserData, (err11, dbData11) => {
              if (data.roleId == 1 && (dbData11[0].experts == dbData11[0].expertsLimit)) {
                cb(null, {
                  statusCode: util.statusCode.OK,
                  statusMessage: "Please contact admin"
                });
                return;
              }
              userDAO.createUser(UserData, (err, dbData) => {
                if (err) {
                  cb(null, {
                    statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                    statusMessage: util.statusMessage.DB_ERROR
                  });
                  return;
                }
                if (dbData && dbData.affectedRows) {
                  if (data.roleId == 1) {
                    userDAO.updateOrg(UserData, (err, dbData) => {

                    })
                  }
                  console.log(data, "data")
                  sentQRMail(data);

                 // if (data.roleId != 4) {
                    // if not technician, (4 is for technician)
                    util.sendEmailExpert({
                      email: data.email,
                      password: passwordMail
                    });
                 // }

                  cb(null, {
                    statusCode: util.statusCode.OK,
                    statusMessage: util.statusMessage.USER_ADDED
                  });
                } else {
                  cb(null, {
                    statusCode: util.statusCode.OK,
                    statusMessage: "User not created."
                  });
                }
              });
            });
          });
        }
      ]
    },
    (err, response) => {
      callback(response.createUserinDB);
    }
  );
};
/*  Login API */
let login = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: async cb => {
        if (!data.email && !data.password) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }

        let criteria = {
          email: data.email,
          roleId: data.roleId ? data.roleId : 1
        };

        const users = await new Promise((resolve, reject) => {
          userDAO.checkUser(criteria, (err11, dbData11) => {
            if (err11) reject(err)
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

        if (!check) {
          // password does not matched
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.INCORRECT_CREDENTIALS
          });
          return
        }

        const orgIDD = users[0].orgId
        userDAO.checkStatus({ orgId: orgIDD }, (err1, dbData1) => {
          if (dbData1 && dbData1[0] && dbData1[0].status.toLowerCase() == 'inactive') {
            cb(null, {
              statusCode: 201,
              statusMessage: "Please contact your admin."
            });
            return
          }
          const token = jwt.sign(
            {
              uid: users[0].userId,
              roleId: users[0].roleId,
              orgId: users[0].orgId
            },
            config.secret,
            {
              expiresIn: config.tokenLife
            }
          );
          users[0].token = token;

          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: util.statusMessage.LOGIN_SUCCESS,
            result: users[0]
          });
        })
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/*  agentLogin API */
let agentLogin = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: async cb => {
        let { empId, Passcode, expireCode } = data

        let email = empId;
        let passwordd = Passcode

        if (!email && !passwordd) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }

        let criteria = {
          email: email,
          password: passwordd,
          expireCode: expireCode? expireCode: ""
        };

        const users = await new Promise((resolve, reject) => {
          userDAO.checkUser(criteria, (err11, dbData11) => {
            if (err11) reject(err)
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
        
        if(expireCode){
          await new Promise((resolve, reject) => {
            util.jwtDecode(criteria.password, (err, decode) => {
              let {passcode} = decode
              criteria.password = passcode
              resolve("success")
            })
          })
          var check = (criteria.password==users[0].passcode)? true: false
          
        }else{
          var check = util.bcriptComparePwd(criteria.password, users[0].password)
        }
     
        if (!check) {
          // password does not matched
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.INCORRECT_CREDENTIALS
          });
          return
        }

        const { userId, roleId, orgId } = users[0]
        const token = jwt.sign(
          {
            uid: userId,
            roleId: roleId,
            orgId: orgId
          },
          config.secret,
          {
            expiresIn: config.tokenLife
          }
        );
        users[0]['token'] = token

        delete users[0]['password']
       
        cb(null, {
          statusCode: util.statusCode.OK,
          statusMessage: util.statusMessage.LOGIN_SUCCESS,
          result: users[0]
        });

      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};
/** Forgot Password API */
let forgotPassword = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.email) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let criteria = {
          email: data.email
        };

        userDAO.getUsers(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }

          if (dbData && dbData.length) {
            const token = jwt.sign(
              {
                uid: dbData[0].userId
              },
              config.secret,
              {
                expiresIn: config.tokenLife
              }
            );

            let forgotToken = util.generateToken();
            let criteria = {
              userId: dbData[0].userId
            };
            let OTP = Math.floor(100000 + Math.random() * 900000);

            let dataToSet = {
              forgotToken: forgotToken,
              forgotOTP: OTP
            };

            userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                  statusMessage: util.statusMessage.DB_ERROR
                });
                return;
              }
            });
            // code to send email...
            util.sendEmail({
              email: data.email,
              forgotToken: forgotToken,
              OTP: OTP,
              token: token,
              webURL: util.webURL
            });
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.EMAIL_SENT
            });
          } else {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: util.statusMessage.INCORRECT_EMAIL
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** org Forgot Password API */
let orgForgotPassword = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.email) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let criteria = {
          email: data.email
        };

        userDAO.organisationLogin(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }

          if (dbData && dbData.length) {
            const token = jwt.sign(
              {
                uid: dbData[0].orgId
              },
              config.secret,
              {
                expiresIn: config.tokenLife
              }
            );

            let forgotToken = util.generateToken();

            let OTP = Math.floor(100000 + Math.random() * 900000);

            let dataToSet = {
              orgId: dbData[0].orgId,
              forgotToken: forgotToken,
              forgotOTP: OTP
            };
            userDAO.updateOrganisations(dataToSet, (err, dbData) => {
              if (err) {
                cb(null, {
                  statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                  statusMessage: util.statusMessage.DB_ERROR
                });
                return;
              }
            });
            // code to send email...
            util.sendEmail({
              email: data.email,
              forgotToken: forgotToken,
              OTP: OTP,
              token: token,
              webURL: util.webURL
            });
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.EMAIL_SENT
            });
          } else {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: util.statusMessage.INCORRECT_EMAIL
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Verify forgot password API */
let verifyForgotPasswordLink = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.token || !data.forgotToken) {
          cb(null, {
            statusCode: util.statusCode.FOUR_ZERO_FOUR,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let userId;
        util.jwtDecode(data.token, (err, decode) => {
          userId = decode.uid;
          roleId = decode.roleId;

          let criteria = {
            userId: userId,
            forgotToken: data.forgotToken,
            roleId: roleId
          };

          userDAO.getUsers(criteria, async (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.length) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: util.statusMessage.OTP_VERIFY_SUCCESS
              });
            } else {
              await userDAO.getUsersOther(criteria, (err1, dbData1) => {
                if (dbData1 && dbData1.length) {
                  cb(null, {
                    statusCode: util.statusCode.OK,
                    statusMessage: util.statusMessage.OTP_VERIFY_SUCCESS
                  });
                } else {
                  cb(null, {
                    statusCode: util.statusCode.FOUR_ZERO_FOUR,
                    statusMessage: util.statusMessage.INVALID_OTP
                  });
                }
              })

            }
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** change password API */
let updateForgotPassword = (data, headers, callback) => {
  let orgFlag = false
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.password || !data.forgotToken) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;

          let criteria = {
            userId: userId,
            forgotToken: data.forgotToken
          };
          userDAO.getUsers(criteria, async (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.length) {
              cb(null);
            } else {
              await userDAO.getUsersOther(criteria, (err1, dbData1) => {
                orgFlag = true
                if (dbData1 && dbData1.length) {
                  cb(null);
                } else {
                  cb(null, {
                    statusCode: util.statusCode.BAD_REQUEST,
                    statusMessage: util.statusMessage.INCORRECT_EMAIL
                  });
                }
              })

            }
          });

        });

        // code to validate token.....
      },
      updateStatusinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (functionData && functionData.checkUserExistsinDB) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }
          let userId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            userId = decode.uid;

            let criteria = {
              userId: userId,
              forgotToken: data.forgotToken
            };
            let dataToSet = {
              password: util.bcriptPwd(data.password)
            };
            if (!orgFlag) {
              userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
                if (err) {
                  cb(null, {
                    statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                    statusMessage: util.statusMessage.DB_ERROR
                  });
                  return;
                }
              });
            } else {
              userDAO.updateOrgPwd(criteria, dataToSet, (err, dbData) => {
                if (err) {
                  cb(null, {
                    statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                    statusMessage: util.statusMessage.DB_ERROR
                  });
                  return;
                }
              });
            }

            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.PASSWORD_UPDATED
            });
          });
          return;
        }
      ]
    },
    (err, response) => {
      callback(response.updateStatusinDB);
    }
  );
};

/*** change password API */
let changePassword = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.oldPassword || !data.newPassword) {
          cb(null, {
            statusCode: util.statusCode.FOUR_ZERO_ONE,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });

        let criteria = {
          userId: userId,
          password: util.bcriptPwd(data.oldPassword)
        };

        userDAO.getUsers(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          }
          if (dbData && dbData.length) {
            cb(null);
          } else {
            cb(null, {
              statusCode: util.statusCode.FOUR_ZERO_FOUR,
              statusMessage: util.statusMessage.INCORRECT_PASSWORD
            });
            return;
          }
        });
      },
      updatePasswordInDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (
            functionData &&
            functionData.checkUserExistsinDB &&
            functionData.checkUserExistsinDB.statusCode
          ) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }

          let userId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            userId = decode.uid;
          });
          let criteria = {
            userId: userId
          };
          let dataToSet = {
            password: util.bcriptPwd(data.newPassword)
          };
          userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.FOUR_ZERO_ONE,
                statusMessage: util.statusMessage.SOMETHING_WENT_WRONG
              });
              return;
            }
          });
          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: util.statusMessage.PASSWORD_CHANGED
          });
        }
      ]
    },
    (err, response) => {
      callback(response.updatePasswordInDB);
    }
  );
};

/**Profile update API */
let profileUpdate = (data, headers, files, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };
        userDAO.getUserInfo(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          }
          cb(null);
        });
      },
      updateUserNameinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (functionData && functionData.checkUserExistsinDB) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }
          let userId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            userId = decode.uid;
          });
          let criteria = {
            userId: userId
          };

          let dataToSet = {
            name: data.name ? data.name : "",
            email: data.email ? data.email : "",
            phone: data.phone ? data.phone : "",
            designation: data.designation ? data.designation : "",
            location: data.location ? data.location : "",
            domainArea: data.domainArea ? data.domainArea : ""
          };

          userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
            if (err) {
              if (err.code == "ER_DUP_ENTRY") {
                cb(null, {
                  statusCode: util.statusCode.BAD_REQUEST,
                  statusMessage: util.statusMessage.EMAIL_EXIST
                });
                return;
              }
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.affectedRows) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: util.statusMessage.PROFILE_UPDATE
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "Profile Not Updated"
              });
            }
          });
        }
      ]
    },
    (err, response) => {
      callback(response.updateUserNameinDB);
    }
  );
};

/**user update API */
let userUpdate = (data, headers, files, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.userId) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let criteria = {
          userId: data.userId
        };
        userDAO.getUserInfo(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          }
          cb(null);
        });
      },
      updateUserNameinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (functionData && functionData.checkUserExistsinDB) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }

          let criteria = {
            userId: data.userId
          };

          let dataToSet = {
            name: data.name ? data.name : "",
            phone: data.phone ? data.phone : "",
            designation: data.designation ? data.designation : "",
            location: data.location ? data.location : "",
            domainArea: data.domainArea ? data.domainArea : "",
            dob: data.dob ? data.dob : "",
            about: data.about ? data.about : "",
            gender: data.gender ? data.gender : null,
            glassId: data.glassId ? data.glassId : null,
            empId: data.empId ? data.empId : null,
            passcode: data.passcode ? data.passcode : null
          };

          let userImage;
          if (
            files &&
            files.userImage &&
            files.userImage[0].filename &&
            files.userImage[0].size > 0
          ) {
            userImage = files.userImage[0].filename;
          }

          if (userImage && userImage != " ") {
            dataToSet.userImage = userImage;
          }


          userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
            if (err) {
              if (err.code == "ER_DUP_ENTRY") {
                cb(null, {
                  statusCode: util.statusCode.BAD_REQUEST,
                  statusMessage: util.statusMessage.EMAIL_EXIST
                });
                return;
              }
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.affectedRows) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: util.statusMessage.PROFILE_UPDATE
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "Profile Not Updated"
              });
            }
          });
        }
      ]
    },
    (err, response) => {
      callback(response.updateUserNameinDB);
    }
  );
};

/**Profile update API */
let profilePicUpdate = (data, headers, files, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };
        userDAO.getUserInfo(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          }
          cb(null);
        });
      },
      updateUserNameinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (functionData && functionData.checkUserExistsinDB) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }
          let userId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            userId = decode.uid;
          });
          let criteria = {
            userId: userId
          };

          let dataToSet = {};

          let userImage;
          if (
            files &&
            files.userImage &&
            files.userImage[0].filename &&
            files.userImage[0].size > 0
          ) {
            userImage = files.userImage[0].filename;
          }

          if (userImage && userImage != " ") {
            dataToSet.userImage = userImage;
          }

          userDAO.updateUser(criteria, dataToSet, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.affectedRows) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: util.statusMessage.PROFILE_UPDATE
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "Profile Not Updated"
              });
            }
          });
        }
      ]
    },
    (err, response) => {
      callback(response.updateUserNameinDB);
    }
  );
};

/** search user by like key */
let location = (data, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        if (!data.token || !data.latitude || !data.longitude) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }

        let dataToSet = {
          token: data.token,
          latitude: data.latitude,
          longitude: data.longitude
        };
        userDAO.location(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              result: "Successfull"
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

let userDetails = (data, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        if (!data.userId) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }

        let dataToSet = {
          userId: data.userId
        };
        userDAO.getUserInfo(dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              result: "Successfull",
              result: dbData
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

/** search user by like key */
let searchByUserName = (data, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        let criteria = {
          userName: data.userName
        };

        userDAO.getUserByUserName(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              result: dbData
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

/** search user by like key */
let getUser = (data, headers, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        var userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };

        userDAO.getUsers(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.FETCHED_SUCCESSFULLY,
              result: dbData[0]
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

/** search user by like key */
let deleteUser = (data, headers, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        var userId;
        if (!data.userId) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let criteria = {
          userId: data.userId
        };
        userDAO.deleteCallHistory(criteria, (err1, dbData1) => {
          userDAO.deleteUser(criteria, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            } else {
              if (dbData && dbData.affectedRows) {
                cb(null, {
                  statusCode: util.statusCode.OK,
                  statusMessage: "Deleted Successfully."
                });
              } else {
                cb(null, {
                  statusCode: util.statusCode.BAD_REQUEST,
                  statusMessage: "Deletion Failed."
                });
              }
            }
          })
        })
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

let getProfile = (data, headers, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        var userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };

        userDAO.getUserProfile(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.FETCHED_SUCCESSFULLY,
              result: dbData[0]
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};
let getDomain = (data, callback) => {
  async.auto(
    {
      checkUserNameExistsinDB: cb => {
        let criteria = {};

        userDAO.getDomain(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          } else {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: util.statusMessage.FETCHED_SUCCESSFULLY,
              result: dbData
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserNameExistsinDB);
    }
  );
};

/** Update Status API */
let updateStatus = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        if (!data.status) {
          cb(null, {
            statusCode: util.statusCode.BAD_REQUEST,
            statusMessage: util.statusMessage.PARAMS_MISSING
          });
          return;
        }
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };
        let dataToSet = {
          status: data.status
        };

        userDAO.updateStatus(criteria, dataToSet, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }
          if (dbData && dbData.affectedRows) {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: "Status Updated"
            });
          } else {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: "Status Not Updated."
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Get Status API */
let getStatus = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };

        userDAO.getStatus(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }
          if (dbData && dbData.length) {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: "Fetch data Successfully",
              result: dbData[0]
            });
          } else {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: "No data Found."
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Get Status API */
let getAgents = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
          orgId = decode.orgId;

          if (!orgId) {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: "No data Found."
            });
            return
          }

          let criteria = {
            roleId: 4,
            orgId: orgId
          };

          userDAO.getAgents(criteria, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }

            if (dbData && dbData.length) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: "Fetch data Successfully",
                result: dbData
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "No data Found."
              });
            }
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Get getExperts API */
let getExperts = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          roleId = decode.roleId;
          orgId = decode.orgId;

          if (!orgId) {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: "No data Found."
            });
            return
          }

          let criteria = {
            roleId: 1,
            orgId: orgId
          };

          userDAO.getAgents(criteria, (err, dbData) => {

            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            if (dbData && dbData.length) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: "Fetch data Successfully",
                result: dbData
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "No data Found."
              });
            }
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Call History API */
let callHistory = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          orgId = decode.orgId
          roleId = decode.roleId;

          let criteria = {
            roleId: 1,
            orgId: decode.orgId
          };

          userDAO.callHistory(criteria, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }

            if (dbData && dbData.length) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: "Fetch data Successfully",
                result: dbData
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "No data Found."
              });
            }
          });
        })
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Call History API */
let callHistoryDetail = (q, headers, callback) => {
  const { userId, dateFilter, statusFilter } = q
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
          orgId = decode.orgId;
        });
        let criteria = {
          userId: userId,
          roleId: roleId,
          orgId: orgId,
          dateFilter: dateFilter,
          statusFilter: statusFilter
        };

        userDAO.callHistoryDetail(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }

          if (dbData && dbData.length) {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: "Fetch data Successfully",
              result: dbData
            });
          } else {
            cb(null, {
              statusCode: util.statusCode.BAD_REQUEST,
              statusMessage: "No data Found."
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Set Call History API */
let setCallHistory = (criteria, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
        });

        userDAO.setCallHistory(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }
          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: "Insert data Successfully"
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Upload screenshot API */
let uploadScreenshot = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
          orgId = decode.orgId;

          var base64Data = data.base64.replace(/^data:image\/png;base64,/, "");
          const filename = Math.floor(Date.now() / 1000) + "~screenshot.png";
          const url = "/images/" + filename;

          //save screenshot in db
          const params = {
            "expert": data.expert,
            "agent": data.agent,
            "path": url,
            "orgId": orgId,
            "streamId": data.streamId
          }

          userDAO.setScreenshot(params, (err1, ress) => {
          })
          const sharp = require('sharp');


          require("fs").writeFile(
            "public/images/" + filename,
            base64Data,
            "base64",
            function (err) {
              console.log(err);
              require("fs").chmod("public/images/" + filename, 0666, error => {
                console.log("Changed file permissions");

                var resizer = sharp().resize(200, 200, {
                  fit: sharp.fit.inside,
                  withoutEnlargement: true
                }).toFile("public/images/" + filename, (err, info) => {
                  console.log(err);
                });

              });
            }
          );

          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: "Fetch data Successfully",
            result: url
          });

        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Upload screenshot API */
let regenerateQR = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId, orgId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
        });

        userDAO.getUserData(data, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }
          if (dbData && dbData.length > 0) {
            sentQRMail(dbData[0]);
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: "Mail sent successfully"
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Set location API */
let setLocation = (data, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        userDAO.setLocation(data, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }

          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: "Data inserted Successfully",
            result: dbData
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

/** Set location API */
let getLocation = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let roleId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          roleId = decode.roleId;
        });

        userDAO.getLocation(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
          }

          if (dbData && dbData.length > 0) {
            cb(null, {
              statusCode: util.statusCode.OK,
              statusMessage: "Fetch data Successfully",
              result: dbData
            });
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let userOnline = (userId, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        const url =
          config.NODE_SERVER_URL.url +
          ":" +
          config.NODE_SERVER_PORT.port +
          "/streams.json";
        const req = request(url, (err, resp, body) => {
          cb(null, {
            statusCode: util.statusCode.OK,
            statusMessage: "Fetch data Successfully",
            result: body
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getContent = (data, callback) => {
  async.auto({
    checkUserExistsinDB: (cb) => {
      userDAO.getContent((err, dbData) => {
        if (err) {
          cb(null, {
            "statusCode": util.statusCode.INTERNAL_SERVER_ERROR,
            "statusMessage": util.statusMessage.DB_ERROR
          })
          return;
        }
        if (dbData) {
          cb(null, {
            "statusCode": util.statusCode.OK,
            "statusMessage": "Success",
            "result": dbData
          });
          return;
        }
      });
    }
  }, (err, response) => {
    callback(response.checkUserExistsinDB);
  })
}

let contact = (data, callback) => {
  async.auto({
    checkUserExistsinDB: (cb) => {
      util.sendContactEmail(data)

      cb(null, {
        "statusCode": util.statusCode.OK,
        "statusMessage": "Success"
      })
    }
  }, (err, response) => {
    callback(response.checkUserExistsinDB);
  })
}

let setGpsState = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          let orgId = decode.orgId
          data['orgId'] = orgId
          userDAO.setGpsState(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success"
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let setGpsStateExpert = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let uid = decode.uid
          let orgId = decode.orgId
          data['uid'] = uid
          data['orgId'] = orgId
          userDAO.setGpsStateExpert(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success"
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let setRecorderStateExpert = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let uid = decode.uid
          let orgId = decode.orgId
          data['uid'] = uid
          data['orgId'] = orgId
          userDAO.setRecorderStateExpert(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success"
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getGpsState = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let orgId = decode.orgId
          data['orgId'] = orgId
          userDAO.getGpsState(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": dbData
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getGpsStateExpert = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let uid = decode.uid
          data['uid'] = uid
          userDAO.getGpsStateExpert(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": dbData
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getRecorderState = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let uid = decode.uid
          data['uid'] = uid
          userDAO.getRecorderState(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": dbData
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getScreenshot = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let expert = decode.uid
          let orgId = decode.orgId
          data['orgId'] = orgId
          data['expert'] = expert
          userDAO.getScreenshots(data, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
            }
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": dbData
            })
          });
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let setGpsData = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {

          let orgId = decode.orgId
          if (data.setLoc && data.setLoc.length > 0) {
            userDAO.setGpsData({ orgId: orgId, dta: data }, (err, dbData) => {
              if (err) {
                cb(null, {
                  statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                  statusMessage: util.statusMessage.DB_ERROR
                });
              }
              cb(null, {
                "statusCode": util.statusCode.OK,
                "statusMessage": "Success"
              })
            });
          }
          else {
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success"
            })
          }
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getGpsData = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          let orgId = decode.orgId
          let criteria = { orgId: orgId, userId: data.userId }
          userDAO.getGpsData(criteria, (err, dbData) => {
            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": dbData ? dbData : []
            })
          })
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};

let getGpsFlag = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          let orgId = decode.orgId
          let criteria = { orgId: orgId, userId: data.userId }
          userDAO.getGpsFlag(criteria, (err, dbData) => {

            const { orgFlag, expertFlag } = dbData[0]
            let globalFlag = 1
            if (orgFlag == 1 && expertFlag == 1) {
              // on for that expert and all its technicians
              globalFlag = 1
            }
            else if (orgFlag == 1 && expertFlag == 0) {
              // on for that organization but not for that expert
              globalFlag = 0
            }
            else if (orgFlag == 0 && expertFlag == 1) {
              // off for the whole organization
              globalFlag = 1
            }
            else if (orgFlag == 0 && expertFlag == 0) {
              // off for the whole organization
              globalFlag = 0
            }

            cb(null, {
              "statusCode": util.statusCode.OK,
              "statusMessage": "Success",
              "result": { "gps": globalFlag }
            })
          })
        });
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};


let deleteScreenshot = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let criteria = { id: data.id }
        userDAO.deleteScreenshot(criteria, (err, dbData) => {
          cb(null, "success")
        })
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  );
};


let updateCallHistory = (data, headers, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let criteria = { callType: data.callType, id: data.id, desc: data.desc, flag: data.flag, addTitle: data.addTitle, addId: data.addId }
        userDAO.updateCallHistory(criteria, (err, dbData) => {
          cb(null, {
            "statusCode": util.statusCode.OK,
            "statusMessage": "Success"
          })
        })
      }
    },
    (err, response) => {
      callback(response.checkUserExistsinDB);
    }
  )
}


/**Post screen image API */
let postscreenimage = (data, headers, files, callback) => {
  async.auto(
    {
      checkUserExistsinDB: cb => {
        let userId;
        util.jwtDecode(headers.accesstoken, (err, decode) => {
          userId = decode.uid;
        });
        let criteria = {
          userId: userId
        };
        userDAO.getUserInfo(criteria, (err, dbData) => {
          if (err) {
            cb(null, {
              statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
              statusMessage: util.statusMessage.DB_ERROR
            });
            return;
          }
          cb(null);
        });
      },
      updateUserNameinDB: [
        "checkUserExistsinDB",
        (cb, functionData) => {
          if (functionData && functionData.checkUserExistsinDB) {
            cb(null, functionData.checkUserExistsinDB);
            return;
          }
          let userId;
          util.jwtDecode(headers.accesstoken, (err, decode) => {
            userId = decode.uid;
          });

          let dataToSet = {};

          let screenshotImage;
          if (
            files &&
            files.screenshotImage &&
            files.screenshotImage[0].filename &&
            files.screenshotImage[0].size > 0
          ) {
            screenshotImage = files.screenshotImage[0].filename;
          }

          if (screenshotImage && screenshotImage != " ") {
            dataToSet.path = "/images/" + screenshotImage;
          }

          const { agent, expert, orgId, streamId } = data

          dataToSet.agent = agent;
          dataToSet.expert = expert;
          dataToSet.orgId = orgId;
          dataToSet.streamId = streamId;

          userDAO.insertScreenshot(dataToSet, (err, dbData) => {
            if (err) {
              cb(null, {
                statusCode: util.statusCode.INTERNAL_SERVER_ERROR,
                statusMessage: util.statusMessage.DB_ERROR
              });
              return;
            }
            if (dbData && dbData.affectedRows) {
              cb(null, {
                statusCode: util.statusCode.OK,
                statusMessage: util.statusMessage.PROFILE_UPDATE
              });
            } else {
              cb(null, {
                statusCode: util.statusCode.BAD_REQUEST,
                statusMessage: "Screenshot Not Updated"
              });
            }
          });
        }
      ]
    },
    (err, response) => {
      callback(response.updateUserNameinDB);
    }
  );
};

let createPdf = (data, headers, callback) => {

  let arr = ""

  if (data.screenshots) {
    arr += `<td>
    <div class="screenshot" style="display:block; color: #0056b8; margin-top: 5px; font-size:15px; font-weight:bold;">
     Screenshots
  </div><ul class="flex-container wrap" style="    padding: 0;
    margin: 0;
    list-style: none;
    width: 100%;
    -ms-box-orient: horizontal;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -moz-flex;
    display: -webkit-flex;
    display: flex;">`
    const arrss = JSON.parse(data.screenshots)

    arrss.forEach(img => {
      arr +=
        `<li class="flex-item" style="padding: 5px; margin: 10px 0px;width: 22%;">
        <img style="width:100%;" src="${data.serverUrl}${img.path}"/>
      </li>`
    })
    arr += `</ul></td>`
  }

  let addTitle = ""
  let addId = ""

  if (data.addTitle && (data.addTitle != null || data.addTitle != 'null')) {
    addTitle += `<tr>
        <td  style="padding:10px 0px;" valign="middle"> <div class="calltimesrw" 
        style="
        color: #94959d;
          ">Title : <span style="    color: #0056b8;">${data.addTitle}</span></div></td>
        </tr>`
  }

  if (data.addId && (data.addTitle != null || data.addTitle != 'null')) {
    addId += `<td  style="padding:10px 0px;" valign="middle"> <div class="calltimesrw" 
    style="
    color: #94959d;
      ">Id : <span style="    color: #0056b8;">${data.addId}</span></div></td>
    </tr>`
  }

  var html = ` <table style="font-family: sans-serif; font-weight:bold;">
<tr>
<td> 
   <table style="padding: 20px 0px; border-bottom: 1px solid #f1f2f2;">
  <tr>
    <td rowspan="4">
  <div  class="callerimgbx" 
  style="position: relative;
       float: left;
       width: 80px;
       height: 80px;
       border-radius: 100%;
       box-shadow: 0px 2px 9px 0px rgba(0, 0, 0, 0.15);
       overflow: hidden;"><img  
             style="position: absolute;
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            max-width: 100%;
            max-height: 100%;
            margin: auto;
            -webkit-transform: scale(1);
            transform: scale(1);"alt="" src="${config.WEB_URL}/assets/images/female_agent.png"></div>
  </td>
  </tr>
  <tr>
     <td style="
   font-size: 15px;
   padding-left:10px;
   color: #0056b8;
   font-weight:bold;
    margin-top: 5px;">${data.name}</td>
  </tr>
  <tr>
     <td style="  
          font-size: 15px;			 
   color: #94959d;
   padding-left:10px;
   font-weight:bold;
         line-height: 20px;">${data.designation}</td>
  </tr>
  <tr>
     <td style="  
   font-size: 15px;
    color: #94959d;
   padding-left:10px;
   font-weight:bold;
         line-height: 20px;">${data.placeName}</td>
  </tr>
 </table>
</td>
</tr>
<tr>

  
           ${arr}
</tr>
<tr>
<td  style="padding:10px 0px;" valign="middle"> <div class="calltimesrw" 
style="
color: #94959d;
  ">Call Duration : <span style="    color: #0056b8;">${data.duration}</span></div></td>
</tr>

  ${addTitle}
  ${addId}

<tr>
<td style="padding:10px 0px;" valign="middle"> <div class="calltimesrw" 
style="
color: #94959d;
 ">Call Type :  <span style="    color: #0056b8;">${data.callType == 1 ? "Video" : "Audio"}</span></div></td>
</tr>
<tr>
<td style="padding:10px 0px;" valign="middle"> <span class="status_wrt" style="    
font-size: 16px;
  color: #94959d;
  display: inline-block;">Status</span>
<button 
   style="
 font-size: 15px;
     color: #fff;
     border: 0;
     padding: 9px 10px;
 border-radius: 24px;
 background-color: #00b882;
 outline: none;
 transition: all 400ms linear;
 display: inline-block;
 margin-left: 10px;
 box-shadow: none;" type="button">${data.status == 1 ? "Completed" : "Incompleted"}</button>

</td>

</tr>
<tr>
 <td>
     <span style="    display: block;
font-size: 16px;
  color: #94959d;"> Description:</span>
<span style="    color: #94959d;
line-height: 24px; font-size:14px; font-weight:normal; display:inline-block; 
padding:14px 0px;">${data.description}</span>
 </td>
</tr>
</table>`

  var fs = require('fs');
  var pdf = require('html-pdf');
  var options = { format: 'Letter' };

  let timeStamp = new Date().getTime()
  let filename = 'call_history_pdf_' + timeStamp + '.pdf'

  pdf.create(html, options).toFile('public/' + filename, function (err, res) {
    if (err) return console.log(err);

    callback({
      statusCode: util.statusCode.OK,
      statusMessage: "Success",
      result: { filename: filename }
    });
  });

}



module.exports = {
  signup: signup,
  login: login,
  forgotPassword: forgotPassword,
  updateForgotPassword: updateForgotPassword,
  verifyForgotPasswordLink: verifyForgotPasswordLink,
  changePassword: changePassword,
  profileUpdate: profileUpdate,
  location: location,
  searchByUserName: searchByUserName,
  getUser: getUser,
  getProfile: getProfile,
  getDomain: getDomain,
  profilePicUpdate: profilePicUpdate,
  updateStatus: updateStatus,
  getStatus: getStatus,
  getAgents: getAgents,
  getExperts: getExperts,
  orgForgotPassword: orgForgotPassword,
  userDetails: userDetails,
  addUser: addUser,
  deleteUser: deleteUser,
  userUpdate: userUpdate,
  callHistory: callHistory,
  agentLogin: agentLogin,
  callHistoryDetail: callHistoryDetail,
  setCallHistory: setCallHistory,
  uploadScreenshot: uploadScreenshot,
  setLocation: setLocation,
  getLocation: getLocation,
  userOnline: userOnline,
  regenerateQR: regenerateQR,
  getContent: getContent,
  contact: contact,
  setGpsState: setGpsState,
  setGpsStateExpert: setGpsStateExpert,
  getGpsState: getGpsState,
  getGpsStateExpert: getGpsStateExpert,
  getScreenshot: getScreenshot,
  setGpsData: setGpsData,
  getGpsData: getGpsData,
  getGpsFlag: getGpsFlag,
  deleteScreenshot: deleteScreenshot,
  updateCallHistory: updateCallHistory,
  postscreenimage: postscreenimage,
  getRecorderState: getRecorderState,
  setRecorderStateExpert: setRecorderStateExpert,
  createPdf: createPdf
};
