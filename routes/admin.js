/*
 * @Author: Ankit Kumar
 * @Date: November 05, 2018
 * @Last Modified by: Ankit kumar
 * @Last Modified On: November 06, 2018
 */


let express = require('express'),
    router = express.Router(),
    userService = require('../services/user'),
    adminService = require('../services/admin');
authHandler = require('../middleware/varifytoken');


var fileExtension = require('file-extension')
var crypto = require('crypto')
var multer = require('multer')
var fs = require('fs');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/profileImage')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + fileExtension(file.mimetype));
        });
    }
});

let storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/orgImage')
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, (err, raw) => {
            cb(null, raw.toString('hex') + Date.now() + '.' + fileExtension(file.mimetype));
        });
    }
});
let upload2 = multer({
    storage: storage2
});
let cpUpload2 = upload2.fields([{
    name: 'image',
    maxCount: 1
}]);

/* signup */
router.post('/signup', (req, res) => {
    userService.signup(req.body, (data) => {
        res.send(data);
    });
});

/* User Login. */
router.post('/login', (req, res) => {
    adminService.login(req.body, (data) => {
        res.send(data);
    });
});

router.get('/organisations', authHandler.verifyToken, (req, res) => {
    adminService.getOrganisations(req.query,req.headers, (data) => {
        res.send(data);
    });
});

router.get('/organisationById', authHandler.verifyToken, (req, res) => {
    adminService.getOrganisationsById(req.query, req.headers, (data) => {
        res.send(data);
    });
});

router.get('/organisationsName', authHandler.verifyToken, (req, res) => {
    adminService.getOrganisationsName(req.body,req.headers, (data) => {
        res.send(data);
    });
});

router.post('/organisations', cpUpload2, authHandler.verifyToken, (req, res) => {
    adminService.organisations(req.body, req.headers, req.files, (data) => {
        res.send(data);
    });
});

router.put('/organisations', cpUpload2, authHandler.verifyToken, (req, res) => {
    adminService.updateOrganisations(req.body, req.headers, req.files, (data) => {
        res.send(data);
    });
});

router.put('/organisation/delete', authHandler.verifyToken, (req, res) => {
    adminService.deleteOrganisations(req.body,req.headers, (data) => {
        res.send(data);
    });
});

router.post('/orgPicUpdate',cpUpload2, (req, res) => {
    adminService.orgPicUpdate(req.body, req.headers, req.files, (data) => {
        res.send(data);
    });
});

router.post('/organisationLogin', (req, res) => {
    adminService.organisationLogin(req.body, (data) => {
        res.send(data);
    });
});

router.post('/addAdmin',(req, res) => {
    adminService.adminSignup(req.body,(data) => {
        res.send(data);
    });
});

router.get('/getAdmin', authHandler.verifyToken, (req, res) => {
    adminService.getAdmin(req.body,req.headers, (data) => {
        res.send(data);
    });
});

router.put('/user', authHandler.verifyToken, (req, res) => {
    adminService.deleteUser(req.body,req.headers, (data) => {
        res.send(data);
    });
});

router.put('/glass/delete', authHandler.verifyToken, (req, res) => {
    adminService.deleteGlass(req.body,req.headers, (data) => {
        res.send(data);
    });
});

router.get('/glass', authHandler.verifyToken, (req, res) => {
    adminService.getGlass(req.query, req.headers, (data) => {
        res.send(data);
    });
});

router.get('/getReports', authHandler.verifyToken, (req, res) => {
    adminService.getReports(req.query,req.headers, (data) => {
        res.send(data);
    });
});

router.post('/setOrganisationStatus', (req, res) => {
    adminService.setStatusOrganisations(req.body, (data) => {
        res.send(data);
    });
});

router.post('/sendNotif', (req, res) => {
    adminService.sendNotif(req.body, (data) => {
        res.send(data);
    });
});

router.post('/content', (req, res) => {
    adminService.content(req.body, (data) => {
        res.send(data);
    });
});

module.exports = router;