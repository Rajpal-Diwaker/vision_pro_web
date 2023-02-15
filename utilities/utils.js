/*
 * @Author: Arjun Sisodia
 */

let config = require("../config/config").config,
  mustache = require("mustache"),
  nodemailer = require("nodemailer"),
  jwt = require("jsonwebtoken"),
  MD5 = require("md5");
let templates = require("./templates");
const bcrypt = require('bcryptjs');

let webURL = require('../config/environment').environment=='live'? config.WEB_URL_OTHER: "http://localhost:4200"

let encryptData = stringToCrypt => {
  return MD5(stringToCrypt);
};

let bcriptPwd = myPlaintextPassword => {
    const saltRounds = 10;
    return bcrypt.hashSync(myPlaintextPassword, saltRounds);
}

let bcriptComparePwd = (myPlaintextPassword, hash) => {
  return bcrypt.compareSync(myPlaintextPassword, hash);
}

// Define Error Codes
let statusCode = {
  ZERO: 0,
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  OK: 200,
  FOUR_ZERO_FOUR: 404,
  FOUR_ZERO_ONE: 401,
  FOUR_ZERO_TWO: 402,
  INTERNAL_SERVER_ERROR: 400,
  FOUR_ZERO_ZERO: 400,
  BAD_REQUEST: 404,
  FIVE_ZERO_ZERO: 500
};

// Define Error Messages
let statusMessage = {
  PARAMS_MISSING: "Mandatory Fields Missing",
  SERVER_BUSY: "Our Servers are busy. Please try again later.",
  PAGE_NOT_FOUND: "Page not found", //404
  PROFILE_UPDATE: "Profile update Successfully.",
  POST_CREATE: "Post create Successfully.",
  POST: "All user post fetch Successfully.",
  INVALID_OTP: "OTP is invalid, Please try again.",
  OTP_VERIFY_SUCCESS: " Set your new password.",
  PASSWORD_CHANGED: "Your Password has changed successfully.",
  OTP_EXPIRED: "Above otp has expired. Please try again.",
  DB_ERROR: "database related error occured", // data base related error...
  GOT_AUDIO_LIST: "Got audio list Successfully",
  INTERNAL_SERVER_ERROR: "Internal server error.", //500
  SOMETHING_WENT_WRONG: "Something went wrong.",
  FETCHED_SUCCESSFULLY: "Fetched Data Successfully.",
  UPLOAD_SUCCESSFUL: "Uploaded Image Successfully.",
  USER_ADDED: "User created successfully.",
  STATUS_UPDATED: "Status updated successfully.",
  USERNAME_UPDATED: "UserName updated successfully.",
  LOGIN_SUCCESS: "Login Successfull.",
  USER_EXIST: "User already exists",
  USERNAME: "userName already exists",
  EMAIL_EXIST: "Email already exists",
  INCORRECT_CREDENTIALS: "Incorrect email or password.",
  INCORRECT_EMAIL: "Please enter correct email.",
  INCORRECT_PASSWORD: "Please enter correct password.",
  EMAIL_SENT: "Email has been sent for password recovery.",
  INVALID_REQUEST: "Invalid Request.",
  INVALID_TOKEN: "User Authentication Failed. Please login again.",
  PASSWORD_UPDATED: "Congratulations! Password updated successfully.",
  MAX_DOWNLOADS: "Audio has already reached to its max number of downloads.",
  NO_SONG: "No any song available to show.",
  EMAIL_SENT_EBOOK: "email sent with ebook link.",
  PAYMENT_UPDATED: "Payment updated successfully.",
  ACCOUNT_RESTORED: "Account restored successfully.",
  USER_CHECK: "User does not exists."
};

let getMysqlDate = rawDate => {
  let date = new Date(rawDate);
  return (
    date.getUTCFullYear() +
    "-" +
    ("00" + (date.getUTCMonth() + 1)).slice(-2) +
    "-" +
    ("00" + date.getUTCDate()).slice(-2)
  );
};
let mailModule = require("../config/sendmail")

if(require("../config/environment").environment == "dev"){
  mailModule = nodemailer.createTransport(config.EMAIL_CONFIG);
}

let sendEmail = data => {
  var mailOptions = {
    from: templates.mailTemplate.from,
    to: data.email,
    subject: templates.mailTemplate.subject,
    html: mustache.render(templates.mailTemplate.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendEmailAdmin = data => {
  var mailOptions = {
    from: templates.mailTemplate.from,
    to: data.email,
    subject: templates.mailTemplate.subject,
    html: mustache.render(templates.mailTemplate.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendEmailOrg = data => {
  var mailOptions = {
    from: templates.mailTemplateOrg.from,
    to: data.email,
    subject: templates.mailTemplateOrg.subject,
    html: mustache.render(templates.mailTemplateNotif1.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendEmailOrg1 = data => {
  var mailOptions = {
    from: templates.mailTemplateOrg.from,
    to: data.email,
    subject: templates.mailTemplateOrg.subject,
    html: mustache.render(templates.mailTemplateNotif.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendEmailAgent = data => {
  var mailOptions = {
    from: templates.mailTemplateAgent.from,
    to: data.email,
    subject: templates.mailTemplateAgent.subject,
    html: mustache.render(templates.mailTemplateAgent.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendPdfEmail = data => {
  var mailOptions = {
    from: templates.mail3Template.from,
    to: data.email,
    subject: templates.mail3Template.subject,
    html: mustache.render(templates.mail3Template.text)
  };
  mailModule.sendMail(mailOptions);
};

let sendVerificationEmail = data => {
  var mailOptions = {
    from: templates.mail2Template.from,
    to: data.email,
    subject: templates.mail2Template.subject,
    html: mustache.render(templates.mail2Template.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendContactEmail = data => {
  var mailOptions = {
    from: templates.contactTemplate.from,
    to: templates.contactTemplate.to,
    subject: templates.contactTemplate.subject,
    html: mustache.render(templates.contactTemplate.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let sendEmailExpert = data => {
  var mailOptions = {
    from: templates.mailTemplateOrg.from,
    to: data.email,
    subject: templates.mailTemplateOrg.subject,
    html: mustache.render(templates.mailTemplateOrg.text, data)
  };
  mailModule.sendMail(mailOptions);
};

let generateToken = () => {
  return Date.now() + Math.floor(Math.random() * 99999) + 1000;
};

let generatePassword = length => {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

let jwtDecode = (token, callback) => {
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      callback(null);
    } else {
      callback(null, decoded);
    }
  });
};

let jwtEncode = auth => {
  var token = jwt.sign({ uid: auth }, config.secret, {});
  return token;
};

let fcmPush = data => {
  var admin = require("firebase-admin");
  var serviceAccount = require(data.serviceAccountUrl);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: data.databaseURL
  });

  var payload = {
    data: {
      MyKey1: data.message
    }
  };

  var options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
  };

  admin
    .messaging()
    .sendToDevice(data.registrationToken, payload, options)
    .then(response => console.log("Successfully sent message:", response))
    .catch(err => console.log("Error sending message", error));
};

let fcmBrowser = data => {
  const webpush = require("web-push");

  const publicVapidKey =
    "BIwAW9IsgwFJPf8koNi1dk7vaLemeZfcscE2Ropx4WARtHfuUjz2tG0ylsW4Z1cGhciLT7xpojgJiDA94DHr0GU";
  const privateVapidKey = "p2bnk4Nz-ktS3gaMTI3ILNx3xjXUw9jThHJOTj_u2jw";

  webpush.setVapidDetails(
    "mailto:arjun.sisodia@ae.com",
    publicVapidKey,
    privateVapidKey
  );

  const payload = JSON.stringify({ title: data.message });
  const subscription = {
    endpoint: ""
  };
  webpush.sendNotification(subscription, payload).catch(error => {
    console.error(error.stack);
  });
};

module.exports = {
  statusCode: statusCode,
  statusMessage: statusMessage,
  getMysqlDate: getMysqlDate,
  encryptData: encryptData,
  sendEmail: sendEmail,
  sendVerificationEmail: sendVerificationEmail,
  generateToken: generateToken,
  sendPdfEmail: sendPdfEmail,
  jwtDecode: jwtDecode,
  jwtEncode: jwtEncode,
  webURL: webURL,
  sendEmailAdmin: sendEmailAdmin,
  generatePassword: generatePassword,
  sendEmailOrg: sendEmailOrg,
  fcmPush: fcmPush,
  fcmBrowser: fcmBrowser,
  sendEmailAgent: sendEmailAgent,
  bcriptPwd: bcriptPwd,
  bcriptComparePwd: bcriptComparePwd,
  sendContactEmail: sendContactEmail,
  sendEmailExpert: sendEmailExpert,
  sendEmailOrg1: sendEmailOrg1
};
