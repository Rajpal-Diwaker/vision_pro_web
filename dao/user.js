"use strict";

let dbConfig = require("../config/dbconfig");
let utils = require("../utilities/utils");

let createUser = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into users set ? ", dataToSet, (err, data) => {
    if (err) {
      callback(err);
    }
    if (dataToSet.glassId) {
      dbConfig
        .getDB()
        .query(
          `Update smart_glasses set isAllocated='True' where id='${
          dataToSet.glassId
          }'`,
          dataToSet,
          (err2, data2) => {
            callback(null, data);
          }
        );
    } else {
      callback(err, data);
    }
  });
};

let createUserInfo = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into user_info set ? ", dataToSet, callback);
};

let createPost = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into post set ? ", dataToSet, callback);
};

let updateOrgPwd = (criteria, dataToSet, callback) => {
  let conditions = ` and orgId = '${criteria.userId}' and forgotToken = '${criteria.forgotToken}'   `;
  let setData = ` password = '${dataToSet.password}' `;

 
  dbConfig
    .getDB()
    .query(`UPDATE organisations SET ${setData} where 1 ${conditions}`, callback)
}

let updateUser = (criteria, dataToSet, callback) => {
  let conditions = "";
  let setData = "";
  criteria.userId ? (conditions += ` and userId = '${criteria.userId}'`) : true;
  criteria.email ? (conditions += ` and email = '${criteria.email}'`) : true;
  criteria.forgotToken
    ? (conditions += ` and forgotToken = '${criteria.forgotToken}'`)
    : true;

  dataToSet.name ? (setData += `  name = '${dataToSet.name}'`) : true;
  dataToSet.password
    ? (setData += `  password = '${dataToSet.password}'`)
    : true;
  dataToSet.forgotToken
    ? (setData += `  forgotToken = '${dataToSet.forgotToken}'`)
    : true;
  dataToSet.email ? (setData += `  , email = '${dataToSet.email}'`) : true;
  dataToSet.location
    ? (setData += `, location = '${dataToSet.location}'`)
    : true;
  dataToSet.phone ? (setData += `, phone = '${dataToSet.phone}'`) : true;
  dataToSet.designation
    ? (setData += `, designation = '${dataToSet.designation}'`)
    : true;
  dataToSet.domainArea
    ? (setData += `, domainArea = '${dataToSet.domainArea}'`)
    : true;
  dataToSet.dob ? (setData += `, dob = '${dataToSet.dob}'`) : true;
  dataToSet.about ? (setData += `, about = '${dataToSet.about}'`) : true;
  dataToSet.glassId ? (setData += `, glassId = '${dataToSet.glassId}'`) : true;
  dataToSet.empId ? (setData += `, empId = '${dataToSet.empId}'`) : true;
  dataToSet.passcode
    ? (setData += `, passcode = '${dataToSet.passcode}'`)
    : true;

  dataToSet.forgotOTP
    ? (setData += `, forgotOTP = '${dataToSet.forgotOTP}'`)
    : true;
  dataToSet.userImage
    ? (setData += ` , userImage = '${dataToSet.userImage}'`)
    : true;
  
  dbConfig
    .getDB()
    .query(`UPDATE users SET ${setData} where 1 ${conditions}`, (err, data) => {
      if (err) {
        callback(err);
      }
      if (dataToSet.glassId) {
        dbConfig
          .getDB()
          .query(
            `Update smart_glasses set isAllocated='True' where id='${
            dataToSet.glassId
            }'`,
            dataToSet,
            (err2, data2) => {
              callback(null, data);
            }
          );
      } else {
        callback(err, data);
      }
    });
};

let checkUser = (criteria, callback) => {
  const { email } = criteria
  let query = `select * from users where email LIKE '${email}'`;
  dbConfig.getDB().query(query, callback);
}

let getUsers = (criteria, callback) => {
  let conditions = "";

  criteria.email ? (conditions += ` and email = '${criteria.email}'`) : true;
  criteria.name ? (conditions += ` and name = '${criteria.name}'`) : true;
  criteria.userId ? (conditions += ` and userId = '${criteria.userId}'`) : true;
  criteria.password
    ? (conditions += ` and password = '${criteria.password}'`)
    : true;
  criteria.forgotOTP
    ? (conditions += ` and forgotOTP = '${criteria.forgotOTP}'`)
    : true;
  criteria.forgotToken
    ? (conditions += ` and forgotToken = '${criteria.forgotToken}'`)
    : true;
  let query = `select password, userId, name, email, phone, designation, location, domainArea, createdAt from users where 1 ${conditions}`;
  
  dbConfig.getDB().query(query, callback);
};

let getUsersOther = (criteria, callback) => {
  let conditions = "";

  criteria.email ? (conditions += ` and orgEmail = '${criteria.email}'`) : true;
  criteria.name ? (conditions += ` and name = '${criteria.name}'`) : true;
  criteria.userId ? (conditions += ` and orgId = '${criteria.userId}'`) : true;
  criteria.password
    ? (conditions += ` and password = '${criteria.password}'`)
    : true;
  criteria.forgotToken
    ? (conditions += ` and forgotToken = '${criteria.forgotToken}'`)
    : true;
  let query = `select orgId,name,orgEmail,address,experts,technician,smartGlass,image, expertsLimit,gpsState,createdAt from organisations where 1 ${conditions}`;
  
  dbConfig.getDB().query(query, callback);
};

let getUserProfile = (criteria, callback) => {
  let conditions = "";

  criteria.email ? (conditions += ` and email = '${criteria.email}'`) : true;
  criteria.userId ? (conditions += ` and users.userId = '${criteria.userId}'`) : true;
  criteria.forgotOTP
    ? (conditions += ` and forgotOTP = '${criteria.forgotOTP}'`)
    : true;
  criteria.forgotToken
    ? (conditions += ` and forgotToken = '${criteria.forgotToken}'`)
    : true;

  dbConfig.getDB().query(
    `select users.userId, users.name as name, email, phone, designation, location, 
    st.name as locationName, users. domainArea, users.userImage, 
    users.domainArea as domainAreaName, org.name as companyName, 
    users.createdAt, users.updatedAt, g.lat, g.lng 
    from users 
    left join organisations as org   on org.orgId = users.orgId 
    left join states as st   on st.id = users.location 
    LEFT JOIN gps g ON users.userId = g.userId
    where 1 ${conditions}`
    ,
    callback
  );
};

let getUserByname = (criteria, callback) => {
  let conditions = "";

  criteria.name ? (conditions += ` name like  '%${criteria.name}%'`) : true;

  dbConfig
    .getDB()
    .query(
      `select userId,name,fullName,email,forgotToken,forgotOTP,facebookId from users where  ${conditions}`,
      callback
    );
};

let location = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into location set ? ", dataToSet, callback);
};

let getUsersLogin = (criteria, callback) => {
  let conditions = "";

  criteria.empId ? (conditions += `and empId = '${criteria.empId}'`) : true;
  criteria.passcode
    ? (conditions += `and passcode = '${criteria.passcode}'`)
    : true;

  criteria.email ? (conditions += `and email = '${criteria.email}'`) : true;
  criteria.password
    ? (conditions += `and password LIKE '${criteria.password}'`)
    : true;
  if (criteria.roleIdOther) {
    criteria.roleId ? (conditions += `and roleId = ${criteria.roleId} OR roleId = ${criteria.roleIdOther} `) : true;
  }
  else {
    criteria.roleId ? (conditions += `and roleId = ${criteria.roleId}`) : true;
  }
  criteria.expireCode
    ? (conditions += `and expireCode = '${criteria.expireCode}'`)
    : true;

  dbConfig.getDB().query(`select * from users where 1 ${conditions}`, callback);
}

let organisationLogin = (criteria, callback) => {
  let conditions = "";

  criteria.email ? (conditions += `and orgEmail = '${criteria.email}'`) : true;
  criteria.password
    ? (conditions += `and password LIKE '${criteria.password}'`)
    : true;
  let query = `select * from organisations where 1 ${conditions}`;

  dbConfig.getDB().query(query, callback);
};

let getUserInfo = (criteria, callback) => {
  let conditions = "";
  criteria.userId ? (conditions += `and userId = '${criteria.userId}'`) : true;
  let query = `Select userId, name, gender, dob, about, email, phone, designation,
  glassId, empId, passcode, status, location, users.domainArea as domA, userImage 
  from users  
  where 1 ${conditions}`;
  
  dbConfig.getDB().query(query, callback);
};

let getDomain = (criteria, callback) => {
  let conditions = "";
  criteria.userId ? (conditions += `and userId = '${criteria.userId}'`) : true;
  dbConfig
    .getDB()
    .query(`select * from domain_areas where 1 ${conditions}`, callback);
};
let updateStatus = (criteria, dataToSet, callback) => {
  let conditions = "";
  let setData = "";
  criteria.userId ? (conditions += ` and userId = '${criteria.userId}'`) : true;

  dataToSet.status ? (setData += `  status = '${dataToSet.status}'`) : true;
  dbConfig
    .getDB()
    .query(`UPDATE users SET ${setData} where 1 ${conditions}`, callback);
};

let updateOrganisation = (dataToSet, callback) => {
  var query = `INSERT INTO organisations (orgId, image) VALUES(${
    dataToSet.orgId
    },'${dataToSet.image}') ON DUPLICATE KEY UPDATE orgId='${
    dataToSet.orgId
    }', image='${dataToSet.image}'`;
 
  dbConfig.getDB().query(query, callback);
};

let getStatus = (criteria, callback) => {
  let conditions = "";
  
  criteria.userId ? (conditions += ` and userId = '${criteria.userId}'`) : true;

  dbConfig
    .getDB()
    .query(`Select status from users where 1 ${conditions}`, callback);
}

let getAgents = (criteria, callback) => {
  let conditions = "";
  criteria.roleId ? (conditions += ` and u.roleId = '${criteria.roleId}' `) : true;
  if(!criteria.orgId){
    callback(null, [])  
    return
  }
  let query = `Select  u.gender, u.userId , u.name, u.email, u.phone, u.designation, u.about, u.location,
              u.domainArea, u.status, u.glassId, u.userImage, g.lat AS latitude, g.lng AS longitude, 
              (SELECT asin FROM smart_glasses WHERE id=u.glassId) AS asin from users u
              LEFT JOIN gps g 
              ON u.userId = g.userId
              where 1 ${conditions} and u.orgId = '${criteria.orgId}'
              GROUP BY u.userId
              ORDER BY u.createdAt DESC
              `;


              console.log(query)

  dbConfig.getDB().query(query, callback);
}

let getAdmin = (criteria, callback) => {
  let conditions = "";
  criteria.roleId ? (conditions += ` and roleId = '${criteria.roleId}'`) : true;
  criteria.orgId ? (conditions += ` and orgId = '${criteria.orgId}'`) : true;

  dbConfig
    .getDB()
    .query(
      `Select userId , email,  createdAt from users where 1 ${conditions}`,
      callback
    );
};

let deleteUser = (criteria, callback) => {
  let conditions = "";
  criteria.userId ? (conditions += ` userId = '${criteria.userId}'`) : true;
  const qry = `delete from users where  ${conditions}`
  
  dbConfig.getDB().query(qry, callback);
};

let deleteCallHistory = (criteria, callback) => {
  let conditions = "";
  criteria.userId ? (conditions += ` userId = '${criteria.userId}'`) : true;
  const qry = `delete from call_history where  ${conditions}`
  
  dbConfig.getDB().query(qry, callback);
};

let getOrganisationsName = (criteria, callback) => {
  dbConfig.getDB().query(`Select orgId, name from organisations`, callback);
};

let getOrganisations = (criteria, callback) => {
  let conditions = "";
  dbConfig
    .getDB()
    .query(
      `Select * from organisations where 1 ${conditions}`,
      async (err, data) => {
        if (err) {
          callback(err);
        }
        //console.log("Start")

        for (let index = 0; index < data.length; index++) {
          await getSubData(data[index]).then(res => {
            data[index].userCounts = res;

            //        console.log(res)
          });
        }

        //console.log("END")
        callback(null, data);

        async function getSubData(data) {
          return new Promise((resolve, reject) => {
            dbConfig
              .getDB()
              .query(
                `SELECT users.roleId , roles.name, count(users.roleId) as roleIdCount FROM users inner join roles on roles.roleId = users.roleId where users.roleId not in (3,5) GROUP by orgId,roleId HAVING orgId =${
                data.orgId
                }`,
                (err2, data2) => {
                  if (err2) {
                    reject(err2);
                  }
                  // console.log(data2)
                  resolve(data2);
                }
              );
          });
        }
      }
    );
};

let getOrganisationsById = (criteria, callback) => {
  let conditions = "";
  criteria.orgId ? (conditions += ` and orgId = '${criteria.orgId}'`) : true;
  const qry = `Select orgId, name, expertsLimit, orgEmail, address, (SELECT COUNT(*) FROM users WHERE orgId=${criteria.orgId} AND roleId=1) AS experts, 
  (SELECT COUNT(*) FROM users WHERE orgId=${criteria.orgId} AND roleId=4) AS technician, 
  (SELECT COUNT(*) FROM smart_glasses WHERE orgID=${criteria.orgId}) AS smartGlass, 
  (SELECT COUNT(*) FROM smart_glasses WHERE orgID=${criteria.orgId} AND isAllocated='True') AS smartGlassAlloc ,
  image, status, createdAt 
  from  organisations where 1 ${conditions}`

  dbConfig
    .getDB()
    .query(
      qry,
      async (err, data) => {
        if (err) {
          callback(err);
        }

        if (data && data.length) {
          await getSubData(data[0]).then(res => {
            data[0].userCounts = res;
          });
          await getGlassData(data[0]).then(res => {
            data[0].smartGlassDetails = res;
          });
        }
        callback(null, data);

        async function getSubData(data) {
          return new Promise((resolve, reject) => {
            dbConfig
              .getDB()
              .query(
                `SELECT users.roleId , roles.name, count(users.roleId) as roleIdCount FROM 
                users left join roles on roles.roleId = users.roleId 
                where users.roleId not in (3,5) 
                GROUP by orgId,roleId HAVING orgId =${
                data.orgId
                }`,
                (err2, data2) => {
                  if (err2) {
                    reject(err2);
                  }
                  resolve(data2);
                }
              );
          });
        }

        async function getGlassData(data) {
          return new Promise((resolve, reject) => {
            dbConfig
              .getDB()
              .query(
                `SELECT *  FROM smart_glasses where orgId =${data.orgId}`,
                (err2, data2) => {
                  if (err2) {
                    reject(err2);
                  }
                  resolve(data2);
                }
              );
          });
        }
      }
    );
};

let organisations = (dataToSet, callback) => {
  dataToSet.experts = dataToSet.experts ? dataToSet.experts : 0
  dataToSet.technician = dataToSet.technician ? dataToSet.technician : 0
  dataToSet.smartGlass = dataToSet.smartGlass ? dataToSet.smartGlass : 0
  dataToSet.expertsLimit = dataToSet.expertsLimit ? dataToSet.expertsLimit : 0

  let query = `insert into organisations (name , orgEmail, address, experts, technician, 
    smartGlass, image, password, expertsLimit) values('${
    dataToSet.name
    }','${dataToSet.orgEmail}','${dataToSet.address}','${dataToSet.experts}','${
    dataToSet.technician
    }','${dataToSet.smartGlass}','${dataToSet.image}','${dataToSet.password}', ${dataToSet.expertsLimit})`;
  dbConfig.getDB().query(query, (err, dbData) => {
    if (err) {
      callback(err);
      return;
    }

    if (
      dbData &&
      dbData.insertId &&
      Array.isArray(dataToSet.smartGlassDetails) && 
      dataToSet.smartGlassDetails &&
      dataToSet.smartGlassDetails.length
    ) {
     
      dbConfig
        .getDB()
        .query(
          "insert into smart_glasses (manufacture, asin, modelNo, orgId) values ? ",
          [
            JSON.parse(dataToSet.smartGlassDetails).map(item => [
              item.manufacture,
              item.asin,
              item.modelNo,
              dbData.insertId
            ])
          ],
          callback(null, dbData)
        );
    } else {
      callback(null, dbData);
      return;
    }
  });
};

let updateOrganisations = (dataToSet, callback) => {
  let setData = "";
  let conditions = "";

  dataToSet.orgId ? (conditions += ` orgId = '${dataToSet.orgId}'`) : true;
  dataToSet.name ? (setData += `  name = '${dataToSet.name}'`) : true;
  dataToSet.orgEmail ? (setData += `  ,orgEmail = '${dataToSet.orgEmail}'`) : true;
  dataToSet.address ? (setData += `  ,address = '${dataToSet.address}'`) : true;
  dataToSet.experts ? (setData += `  ,experts = '${dataToSet.experts}'`) : true;
  dataToSet.technician
    ? (setData += `  , technician = '${dataToSet.technician}'`)
    : true;
  dataToSet.smartGlass
    ? (setData += `, smartGlass = '${dataToSet.smartGlass}'`)
    : true;
  dataToSet.image ? (setData += `, image = '${dataToSet.image}'`) : true;

  dataToSet.forgotToken
    ? (setData += ` forgotToken = '${dataToSet.forgotToken}'`)
    : true;

  dataToSet.expertsLimit
    ? (setData += ` , expertsLimit = ${dataToSet.expertsLimit}`)
    : true;

  let query = `update organisations set ${setData} where ${conditions}`;

  dbConfig.getDB().query(query, async (err, dbData) => {
  
    if (err) {
      callback(err);
      return;
    }

    dataToSet.smartGlassDetails = dataToSet.smartGlassDetails? JSON.parse(dataToSet.smartGlassDetails): []

    if (
      dbData &&
      dbData.affectedRows &&
      dataToSet.smartGlassDetails &&
      dataToSet.smartGlassDetails.length
    ) {
 
       for (let index = 0; index < dataToSet.smartGlassDetails.length; index++) {
          dataToSet.smartGlassDetails[index].orgId = dataToSet.orgId;
          await update(dataToSet.smartGlassDetails[index]).then(res => { });
        }

      callback(null, dbData);

      async function update(data) {
        return new Promise((reso, reje) => {
          if (data.id && data.flag && data.flag == 1) {
            dbConfig
              .getDB()
              .query(
                `delete from  smart_glasses where id=${data.id}`,
                (err2, data2) => {
                  if (err2) {
                    reje(err2);
                    return;
                  }
                  reso(data2);
                }
              );
          } else if (data.id) {
            dbConfig
              .getDB()
              .query(
                `insert into smart_glasses (id,manufacture,asin,modelNo,orgId) values('${
                data.id
                }','${data.manufacture}','${data.asin}','${data.modelNo}','${
                data.orgId
                }') ON DUPLICATE KEY UPDATE manufacture='${
                data.manufacture
                }' , asin='${data.asin}',modelNo='${data.modelNo}', orgId='${
                data.orgId
                }'`,
                (err2, data2) => {
                  if (err2) {
                    reje(err2);
                    return;
                  }
                  reso(data2);
                }
              );
          } else {
            dbConfig
              .getDB()
              .query(
                `insert into smart_glasses (manufacture,asin,modelNo,orgId) values('${
                data.manufacture
                }','${data.asin}','${data.modelNo}','${data.orgId}')`,
                (err2, data2) => {
                  if (err2) {
                    reje(err2);
                    return;
                  }
                  reso(data2);
                }
              );
          }
        });
      }
    } else {
      callback(null, dbData);
      return;
    }
  });
};

let deleteOrganisations = (criteria, callback) => {
  let query1 = `delete from users where orgId = ${criteria.orgId}`;
  let query2 = `delete from organisations where orgId = ${criteria.orgId}`;
  let query3 = `delete from smart_glasses where orgID = ${criteria.orgId}`;
  let query4 = `delete from screenshot where orgId = ${criteria.orgId}`;
  let query5 = `delete from gps where orgId = ${criteria.orgId}`;
  let query6 = `delete from domain_areas where orgId = ${criteria.orgId}`;
  let query7 = `delete from call_history where orgId = ${criteria.orgId}`;

  dbConfig.getDB().query(query7, (err2, dbDat2) => {
  dbConfig.getDB().query(query6, (err2, dbDat2) => {
  dbConfig.getDB().query(query5, (err2, dbDat2) => {
  dbConfig.getDB().query(query4, (err2, dbDat2) => {
  dbConfig.getDB().query(query3, (err2, dbDat2) => {
    dbConfig.getDB().query(query1, (err, dbData) => {
      dbConfig.getDB().query(query2, (err2, dbDat2) => {
        if (err) {
          callback(err);
          return;
        }
        callback(err2, dbDat2);
        return;
      });
    });
  });
});
});
});
});
};

let deleteGlass = (criteria, callback) => {
  let setData = "";
  let conditions = "";
  criteria.id ? (conditions += ` id = '${criteria.id}'`) : true;
  let query = `delete from  smart_glasses  where ${conditions}`;

  dbConfig.getDB().query(query, (err, dbDat) => {
    if (err) {
      callback(err);
      return;
    }
    let query = `update  organisations  set smartGlass=( select count(*) from  smart_glasses  where orgId = '${
      criteria.orgID
      }' )  where orgId = '${criteria.orgID}'`;
    dbConfig.getDB().query(query, (err2, dbDat2) => {
      if (err2) {
        callback(err2);
        return;
      }
      callback(err2, dbDat2);
      return;
    });
  });
};

let getGlass = (criteria, callback) => {
  let conditions = "";
  criteria.orgId ? (conditions += ` orgId = ${criteria.orgId}`) : true;
  criteria.isAllocated
    ? (conditions += ` and isAllocated = '${criteria.isAllocated}'`)
    : true;
  criteria.id ? (conditions += ` or id = '${criteria.id}'`) : true;
  let query = `select * from  smart_glasses  where ${conditions}`;

  dbConfig.getDB().query(query, callback);
};

let callHistory = (criteria, callback) => {
  if(!criteria.orgId) {
    callback(null, []);
    return;
  }
  let condition = "";
  condition += criteria.orgId ? " AND ch.orgId=" + criteria.orgId : ""

  let query = `SELECT ch.description, ch.status as callStatus, u.name, 
                  u.userImage, u.status, u.location, roles.name AS role, 
                  u.designation, u.userId
                  FROM call_history ch
                  LEFT JOIN users u ON ch.agentUid=u.userId
                  LEFT JOIN organisations org ON ch.orgId=org.orgId
                  LEFT JOIN roles ON u.roleId=roles.roleId 
                  WHERE roles.name IN('Expert', 'Agent')
                  ${condition}
                `;
  
  dbConfig.getDB().query(query, callback);
};

let getReports = (obj, callback) => {
  let query = `SELECT status, createdAt FROM organisations 
                WHERE YEAR(createdAt) = YEAR(CURDATE())
                ORDER BY createdAt`;
  dbConfig.getDB().query(query, (err, dbData11) => {
    if (err) {
      callback(err);
      return;
    }

    let query1 = `SELECT isAllocated, createdAt FROM smart_glasses 
                  WHERE YEAR(createdAt) = YEAR(CURDATE())
                  ORDER BY createdAt
                  `;
    dbConfig.getDB().query(query1, (err, dbData2) => {
      if (err) {
        callback(err);
        return;
      }

      const result = { organisations: dbData11, smart_glasses: dbData2 };

      callback(null, result);
    });
  });
};

let setStatusOrganisations = (dataToSet, callback) => {
  let setData = "";
  let conditions = "";
  const { orgId, status } = dataToSet;
  orgId ? (conditions += ` orgId = '${orgId}'`) : true;
  status ? (setData += `  status = '${status}'`) : true;

  let query = `update organisations set ${setData} where ${conditions}`;
  dbConfig.getDB().query(query, async (err, dbData) => {
    if (err) {
      callback(err);
      return;
    }
    if (dbData) {
      dbConfig
        .getDB()
        .query(
          `insert into report_logs(type,status) values('Organisation','${status}')`,
          (err, data) => {
            if (err) {
              callback(null, dbData);
              return;
            }
            callback(null, dbData);
          }
        );
    } else {
      callback(null, dbData);
      return;
    }
  });
};

let sendNotif = (data, callback) => {

  const {
    email,
    push_notification,
    organization,
    description
  } = data;

  if (email) {
    let util = require("../utilities/utils");
    let emailArr = organization.email
    emailArr.forEach(obj => {
      const { itemName } = obj
      data["email"] = itemName;
      data["description"] = organization.description;
      delete data.organization
      util.sendEmailOrg(data);
    });
  }

  if (push_notification) {
    let util = require("../utilities/utils");
    data["serviceAccountUrl"] =
      "../visionr-pro-2211-firebase-adminsdk-c89pn-7bdf34c2cd";
    data["databaseURL"] = "https://visionr-pro-2211.firebaseio.com";
    data["message"] = description;
    data["registrationToken"] = "";

    util.fcmBrowser(data);
  }
};

let callHistoryDetail = (criteria, callback) => {
  let conditions = "";

  criteria.dateFilter
    ? (conditions += ` and ch.createdOn >= '${criteria.dateFilter} 00:00:00'
       and ch.createdOn <= '${criteria.dateFilter} 23:59:59' `)
    : true;

  (criteria.statusFilter && criteria.statusFilter != 2)
    ? (conditions += ` and ch.status = '${criteria.statusFilter}' `)
    : true;


  let query = `SELECT u.name, u.designation, u.userImage, ch.id, u.gender, 
      ch.userId AS agentId, ch.startTime, ch.endTime, ch.callType, ch.addTitle, ch.addId,
      g.lat AS latitude, g.lng AS longitude,
      ch.duration, ch.description, ch.createdOn, ch.status 
      FROM call_history ch
      LEFT JOIN users u ON u.userId=ch.userId
      LEFT JOIN gps g ON u.userId=g.userId
      WHERE ch.agentUid=${criteria.userId} ${conditions}
      GROUP BY ch.id
      ORDER BY ch.createdOn DESC
      `;

  console.log(query, "query")
  dbConfig.getDB().query(query, callback);
};

let setCallHistory = (dataToSet, callback) => {
  const { userId, agentUid, startTime, endTime, duration, description, status, orgId, streamId, callType } = dataToSet;

  let query = `insert into call_history(userId, agentUid, startTime, endTime, duration, 
    description, status, orgId, callType) 
  values (${userId}, ${agentUid}, '${startTime}', '${endTime}', '${duration}', '${description}', ${status}, ${orgId}, ${callType} )`;
  dbConfig.getDB().query(query, (err, data) => {
    if (err) {
      callback(err);
    }
    let insertId = data.insertId

    if (insertId) {
      let query1 = `insert into call_stream_Ids(streamId, callHistoryId) 
        values ('${streamId}', ${insertId})`;

      dbConfig.getDB().query(query1, (err, res) => {
      })
    }

    callback(data);
  });
};

let setLocation = (dataToSet, callback) => {
  let query = `insert into location(token, latitude, longitude) values ('', '${
    dataToSet.latitude
    }', '${dataToSet.longitude}')`;
  dbConfig.getDB().query(query, (err, data) => {
    if (err) {
      callback(err);
    }
    if (dataToSet.userId) {
      dbConfig
        .getDB()
        .query(
          `Update users set location='${data.insertId}' where userId=${
          dataToSet.userId
          }`,
          dataToSet,
          (err2, data2) => {
            callback(null, data);
          }
        );
    } else {
      callback(err, data);
    }
  });
};

let getLocation = (criteria, callback) => {
  let conditions = "";

  criteria.userId ? (conditions += ` email = '${criteria.userId}'`) : true;

  dbConfig.getDB().query(
    `select l.longitude, l.latitude, u.name
       from location l
      inner join users as u l.id = u.location
      where 1 ${conditions}`,
    callback
  );
};

let getUserData = (criteria, callback) => {
  let conditions = "";

  criteria.userId ? (conditions += ` userId = '${criteria.userId}'`) : true;
  const expireCode = utils.generatePassword(16);
  const passcode = utils.generatePassword(4);
  let query = `Update users set expireCode='${expireCode}', passcode='${passcode}' where userId=${
    criteria.userId
    }`;

  dbConfig.getDB().query(query, (err, data) => {
    if (err) {
      callback(err);
    }
    dbConfig.getDB().query(
      `select userId, email, empId, passcode, password, expireCode, name from users 
        where ${conditions}`,
      callback
    );
  })
};

let updateOrg = (criteria, callback) => {
  const query1 = `SELECT CAST(experts AS UNSIGNED) AS experts 
  FROM organisations WHERE orgId=${criteria.orgId}`
  dbConfig.getDB().query(query1, (err, res) => {
    const exp = res[0].experts + 1
    let query = `Update organisations set 
      experts=${exp}
      where orgId=${criteria.orgId}`;

    dbConfig.getDB().query(query, callback);
  })
};

let checkLimit = (criteria, callback) => {
  const query1 = `SELECT experts, expertsLimit
  FROM organisations WHERE orgId=${criteria.orgId}`
  console.log(query1)
  dbConfig.getDB().query(query1, callback)
};

let content = (dataToSet, callback) => {
  const qry = `SELECT COUNT(post) AS post_count FROM content`;

  dbConfig.getDB().query(qry, (err, data) => {
    const post_count = data[0].post_count;
    const content = JSON.stringify(dataToSet);
    if (post_count > 0) {
      dbConfig.getDB().query(`Update content set 
      post=?`, content, callback);
    } else {
      const qry = `insert into content(post) values ('${content}')`;
      dbConfig.getDB().query(qry, callback);
    }
  })
};

let getContent = callback => {
  const query = `SELECT post FROM content 
  ORDER BY ID DESC LIMIT 1`
  dbConfig.getDB().query(query, callback)
};

let checkStatus = (criteria, callback) => {
  const query = `SELECT status FROM organisations
  WHERE orgId=${criteria.orgId}`
  dbConfig.getDB().query(query, callback)
};

let setGpsState = (criteria, callback) => {
  let setData = ` gpsState=${criteria.gpsState} `
  const qry = `UPDATE organisations SET ${setData} where orgId=${criteria.orgId}`

  dbConfig
    .getDB()
    .query(qry, callback)
};

let setGpsStateExpert = (criteria, callback) => {
  const { gpsState, orgId, uid } = criteria
  let setData = ` gpsState=${gpsState} `
  const qry = `UPDATE users SET ${setData} 
  where (roleId=4 AND orgId=${orgId}) OR userId=${uid}
  `

  dbConfig
    .getDB()
    .query(qry, callback)
};

let setRecorderStateExpert = (criteria, callback) => {
  const { recorderState, orgId, uid } = criteria
  let setData = ` recorderState=${recorderState} `
  const qry = `UPDATE users SET ${setData} 
  where userId=${uid}
  `

  dbConfig
    .getDB()
    .query(qry, callback)
};

let getGpsState = (criteria, callback) => {
  const qry = `SELECT gpsState FROM organisations WHERE orgId=${criteria.orgId}`

  dbConfig
    .getDB()
    .query(qry, callback)
};

let getGpsStateExpert = (criteria, callback) => {
  const qry = `SELECT gpsState FROM users WHERE userId=${criteria.uid}`

  dbConfig
    .getDB()
    .query(qry, callback)
};

let getRecorderState = (criteria, callback) => {
  const qry = `SELECT recorderState FROM users WHERE userId=${criteria.uid}`

  dbConfig
    .getDB()
    .query(qry, callback)
};

let setScreenshot = (dataToSet, callback) => {

  const qry = `insert into screenshot(expert, agent, path, orgId, streamId) 
  values (${dataToSet.expert}, ${dataToSet.agent}, '${dataToSet.path}', ${dataToSet.orgId}, '${dataToSet.streamId}')`

  dbConfig.getDB().query(qry, callback);
};

let getScreenshots = (criteria, callback) => {
  const qry = `SELECT id, expert, agent, orgId, path, streamId FROM screenshot 
  WHERE orgId=${criteria.orgId} AND streamId=(SELECT streamId FROM call_stream_Ids 
  WHERE callHistoryId=${criteria.callHistoryId} ORDER BY id DESC LIMIT 1)`


  dbConfig.getDB().query(qry, callback);
};

let setGpsData = (dataToSet, callback) => {
  let dta = (typeof dataToSet.dta.setLoc == "string") ? JSON.parse(dataToSet.dta.setLoc) : dataToSet.dta.setLoc
  let orgId = dataToSet.orgId
  let str = ""
  let length = dta.length
  let userIdArr = []
  dta.forEach((obj, i) => {
    const { latitude, longitude, userId } = obj

    userIdArr.push(userId)
    let s = "('" + latitude + "','" + longitude + "'," + userId + "," + orgId + ")"
    str += (i == length - 1) ? s : s + ","
  })

  userIdArr = userIdArr.join(",")

  dbConfig.getDB().query(`DELETE FROM gps WHERE userId IN (${userIdArr}) AND orgId=${orgId}`, (err1, res1) => {


    let query = `insert into gps (lat, lng, userId, orgId) values ${str}`;

    dbConfig.getDB().query(query, callback);
  })
}

let getGpsData = (criteria, callback) => {
  let { userId, orgId } = criteria
  userId = JSON.parse(userId).join()
  const query = `SELECT gps.lat, gps.lng, gps.userId, users.name 
  FROM gps
  LEFT JOIN users
  ON gps.userId=users.userId
  WHERE gps.userId IN (${userId}) AND gps.orgId=${orgId}
  `

  dbConfig.getDB().query(query, callback);
}

let getGpsFlag = (criteria, callback) => {
  let { userId, orgId } = criteria
  const query = `SELECT (SELECT gpsState FROM organisations WHERE orgId=${orgId}) AS orgFlag, 
  gpsState AS expertFlag 
  FROM users
  WHERE userId=${userId} AND orgId=${orgId} AND roleId=4`

  /* role id = 4 is for agent */

  dbConfig.getDB().query(query, callback);
}

let deleteScreenshot = (criteria, callback) => {
  const { id } = criteria
  const query = `DELETE FROM screenshot WHERE id=${id}`

  dbConfig.getDB().query(query, callback);
}

let updateCallHistory = (criteria, callback) => {
  let { id, desc, status, flag, callType, addTitle, addId } = criteria
  addTitle = addTitle ? addTitle : "null"
  addId = addId ? addId : "null"

  const query = `UPDATE call_history SET description='${desc}', status=${flag}, callType=${callType}
  ,addTitle='${addTitle}', addId='${addId}'
  WHERE id=${id}
  `

  dbConfig.getDB().query(query, callback);
}

let insertScreenshot = (dataToSet, callback) => {
  dbConfig.getDB().query("insert into screenshot set ? ", dataToSet, callback);
};

module.exports = {
  createUser: createUser,
  createUserInfo: createUserInfo,
  createPost: createPost,
  getUsers: getUsers,
  getUserProfile: getUserProfile,
  getUsersLogin: getUsersLogin,
  updateUser: updateUser,
  getUserInfo: getUserInfo,
  getUserByname: getUserByname,
  location: location,
  getDomain: getDomain,
  updateStatus: updateStatus,
  getStatus: getStatus,
  getAgents: getAgents,
  getOrganisations: getOrganisations,
  organisations: organisations,
  updateOrganisation: updateOrganisation,
  getAdmin: getAdmin,
  getOrganisationsName: getOrganisationsName,
  getOrganisationsById: getOrganisationsById,
  deleteUser: deleteUser,
  updateOrganisations: updateOrganisations,
  deleteOrganisations: deleteOrganisations,
  deleteGlass: deleteGlass,
  organisationLogin: organisationLogin,
  getGlass: getGlass,
  callHistory: callHistory,
  setStatusOrganisations: setStatusOrganisations,
  getReports: getReports,
  sendNotif: sendNotif,
  callHistoryDetail: callHistoryDetail,
  setCallHistory: setCallHistory,
  setLocation: setLocation,
  getLocation: getLocation,
  getUserData: getUserData,
  updateOrg: updateOrg,
  checkLimit: checkLimit,
  content: content,
  getContent: getContent,
  deleteCallHistory: deleteCallHistory,
  checkStatus: checkStatus,
  setGpsState: setGpsState,
  setGpsStateExpert: setGpsStateExpert,
  getGpsState: getGpsState,
  getGpsStateExpert: getGpsStateExpert,
  setScreenshot: setScreenshot,
  getScreenshots: getScreenshots,
  setGpsData: setGpsData,
  getGpsData: getGpsData,
  getGpsFlag: getGpsFlag,
  deleteScreenshot: deleteScreenshot,
  updateCallHistory: updateCallHistory,
  insertScreenshot: insertScreenshot,
  getRecorderState: getRecorderState,
  setRecorderStateExpert: setRecorderStateExpert,
  getUsersOther: getUsersOther,
  updateOrgPwd: updateOrgPwd,
  checkUser: checkUser
}