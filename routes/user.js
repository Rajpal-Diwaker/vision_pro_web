/*
 * @Author: Ankit Kumar
 * @Date: November 05, 2018
 * @Last Modified by: Ankit kumar
 * @Last Modified On: November 06, 2018
 */

let express = require("express"),
  router = express.Router(),
  userService = require("../services/user");
  authHandler = require("../middleware/varifytoken");

var fileExtension = require("file-extension");
var crypto = require("crypto");
var multer = require("multer");
let validator = require("../helpers/validator") 

let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/profileImage");
  },
  filename: function(req, file, cb) {
    crypto.pseudoRandomBytes(16, function(err, raw) {
      cb(
        null,
        raw.toString("hex") + Date.now() + "." + fileExtension(file.mimetype)
      );
    });
  }
});

let upload = multer({
  storage: storage
});
let cpUpload = upload.fields([
  {
    name: "userImage",
    maxCount: 1
  }
]);

/* screenshot upload */
let screenshotStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/images");
  },
  filename: function(req, file, cb) {
    crypto.pseudoRandomBytes(16, function(err, raw) {
      cb(
        null,
        raw.toString("hex") + Date.now() + "." + fileExtension(file.mimetype)
      );
    });
  }
});

let screenshotupload = multer({
  storage: screenshotStorage
});
let screenUpload = screenshotupload.fields([
  {
    name: "screenshotImage",
    maxCount: 1
  }
]);

/* screenshot upload ends */

/* signup */
router.post("/signup", (req, res) => {
  userService.signup(req.body, data => {
    res.send(data);
  });
});

/* User Login. */
router.post("/login", (req, res) => {
  userService.login(req.body, data => {
    res.send(data);
  });
});

/* Technician  Login. */
router.post("/agentLogin", (req, res) => {
  userService.agentLogin(req.body, data => {
    res.send(data);
  });
});

/* User forgot password. */
router.post("/forgotPassword", (req, res) => {
  userService.forgotPassword(req.body, data => {
    res.send(data);
  });
});

/* User forgot password. */
router.post("/orgForgotPassword", (req, res) => {
  userService.orgForgotPassword(req.body, data => {
    res.send(data);
  });
});

/* Verify forgot password. */
router.post("/verifyForgotPasswordLink", (req, res) => {
  userService.verifyForgotPasswordLink(req.body, data => {
    res.send(data);
  });
});

/* Update forgot password. */
router.put("/updateForgotPassword", authHandler.verifyToken, (req, res) => {
  userService.updateForgotPassword(req.body, req.headers, data => {
    res.send(data);
  });
});

/* Change Password */
router.put("/changePassword", authHandler.verifyToken, (req, res) => {
  userService.changePassword(req.body, req.headers, data => {
    res.send(data);
  });
});

/**user update profile */
router.put("/profileUpdate", authHandler.verifyToken, cpUpload, (req, res) => {
  userService.profileUpdate(req.body, req.headers, req.files, data => {
    res.send(data);
  });
});

/**user update profile */
router.put("/update", authHandler.verifyToken, cpUpload, (req, res) => {
  userService.userUpdate(req.body, req.headers, req.files, data => {
    res.send(data);
  });
});

router.post(
  "/profilePicUpdate",
  authHandler.verifyToken,
  cpUpload,
  (req, res) => {
    userService.profilePicUpdate(req.body, req.headers, req.files, data => {
      res.send(data);
    });
  }
);

/* verify email */
router.get("/verifyEmail", (req, res) => {
  userService.verifyEmail(req.query, data => {
    res.send(data);
  });
});

router.post("/searchByUserName", (req, res) => {
  userService.searchByUserName(req.query, data => {
    res.send(data);
  });
});

router.get("/user", (req, res) => {
  userService.getUser(req.body, req.headers, data => {
    res.send(data);
  });
});

router.put("/delete", authHandler.verifyToken, (req, res) => {
  userService.deleteUser(req.body, req.headers, data => {
    res.send(data);
  });
});

router.get("/profile", (req, res) => {
  userService.getProfile(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/location", (req, res) => {
  userService.location(req.body, data => {
    res.send(data);
  });
});

router.post("/userDetails", (req, res) => {
  userService.userDetails(req.body, data => {
    res.send(data);
  });
});

router.get("/domain", (req, res) => {
  userService.getDomain(req.body, data => {
    res.send(data);
  });
});

router.put("/status", authHandler.verifyToken, (req, res) => {
  userService.updateStatus(req.body, req.headers, data => {
    res.send(data);
  });
});

router.get("/status", authHandler.verifyToken, (req, res) => {
  userService.getStatus(req.body, req.headers, data => {
    res.send(data);
  });
});

router.get("/agents", authHandler.verifyToken, (req, res) => {
  userService.getAgents(req.body, req.headers, data => {
    res.send(data);
  });
});

router.get("/experts", authHandler.verifyToken, (req, res) => {
  userService.getExperts(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/experts", authHandler.verifyToken, cpUpload, (req, res) => {
  req.body.roleId = 1;
  userService.addUser(req.body, req.headers, req.files, data => {
    res.send(data);
  });
});

router.post("/agents", authHandler.verifyToken, cpUpload, validator.global_validator, (req, res) => {
  req.body.roleId = 4;
  userService.addUser(req.body, req.headers, req.files, data => {
    res.send(data);
  })
})

router.get("/callHistory", authHandler.verifyToken, (req, res) => {
  userService.callHistory(req.query, req.headers, data => {
    res.send(data);
  });
});

router.get("/callHistoryDetail", authHandler.verifyToken, (req, res) => {
  userService.callHistoryDetail(req.query, req.headers, data => {
    res.send(data);
  });
});

router.post("/setCallHistory", authHandler.verifyToken, (req, res) => {
  userService.setCallHistory(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/uploadScreenshot", authHandler.verifyToken, (req, res) => {
  userService.uploadScreenshot(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/regenerateQR", authHandler.verifyToken, (req, res) => {
  userService.regenerateQR(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/setLocation", (req, res) => {
  userService.setLocation(req.body, data => {
    res.send(data);
  });
});

router.post("/getLocation", authHandler.verifyToken, (req, res) => {
  userService.getLocation(req.body, req.headers, data => {
    res.send(data);
  });
});

router.get("/userOnline", (req, res) => {
  userService.userOnline(req.query, data => {
    res.send(data);
  });
});

router.get("/getContent", (req, res) => {
  userService.getContent(req.body, data => {
    res.send(data);
  });
});

router.get("/contact", (req, res) => { 
  userService.contact(req.query, data => {
    res.send(data);
  });
});

router.post("/setGpsState", authHandler.verifyToken, (req, res) => {
  userService.setGpsState(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/setGpsStateExpert", authHandler.verifyToken, (req, res) => {
  userService.setGpsStateExpert(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/setRecorderStateExpert", authHandler.verifyToken, (req, res) => {
  userService.setRecorderStateExpert(req.body, req.headers, data => {
    res.send(data);
  });
});


router.post("/getGpsState", authHandler.verifyToken, (req, res) => {
  userService.getGpsState(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/getGpsStateExpert", authHandler.verifyToken, (req, res) => {
  userService.getGpsStateExpert(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/getRecorderState", authHandler.verifyToken, (req, res) => {
  userService.getRecorderState(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/getScreenshot", authHandler.verifyToken, (req, res) => {
  userService.getScreenshot(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/setGps", authHandler.verifyToken, (req, res) => {
  userService.setGpsData(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/getGps", authHandler.verifyToken, (req, res) => {
  userService.getGpsData(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/getGpsFlag", authHandler.verifyToken, (req, res) => {
  userService.getGpsFlag(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/deleteScreenshot", authHandler.verifyToken, (req, res) => {
  userService.deleteScreenshot(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post("/updateCallHistory", authHandler.verifyToken, (req, res) => {
  userService.updateCallHistory(req.body, req.headers, data => {
    res.send(data);
  });
});

router.post(
  "/postscreenimage",
  authHandler.verifyToken,
  screenUpload,
  (req, res) => {
    userService.postscreenimage(req.body, req.headers, req.files, data => {
      res.send(data);
    });
  }
);

router.post("/createPdf", authHandler.verifyToken, (req, res) => {
  userService.createPdf(req.body, req.headers, data => {
    res.send(data);
  });
});

module.exports = router;
