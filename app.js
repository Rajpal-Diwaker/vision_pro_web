/**
 * Module dependencies.
 */
var express = require('express'),
  path = require('path'),
  streams = require('./app/streams.js')();

var favicon = require('serve-favicon'),
  logger = require('morgan'),
  methodOverride = require('method-override'),
  bodyParser = require('body-parser'),
  errorHandler = require('errorhandler');
const helmet = require('helmet')



let userRoute = require('./routes/user');
let adminRoute = require('./routes/admin');

let fs = require("fs");

var options = {
	key: fs.readFileSync(path.join(__dirname, 'certificate') + '/mobenture.key').toString(),
  cert: fs.readFileSync(path.join(__dirname, 'certificate') + '/mobenture.crt').toString(),
  ca: fs.readFileSync(path.join(__dirname, 'certificate') + '/bundle.crt').toString()
};

var app = express();

let allow_Str = "*"
if ('development' == app.get('env')) {
  allow_Str = 'http://localhost:4200'
}

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', "*");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,accesstoken');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(helmet())

// all environments
app.set('port', process.env.PORT || 6262);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only

if ('development' == app.get('env')) 
  app.use(errorHandler());

// routing
app.use('/user', userRoute);
app.use('/admin', adminRoute);
require('./app/routes.js')(app, streams);

server = require('https').Server(options, app)
server.listen(app.get('port'), function () {
   console.log('Express server listening on port:: ' + app.get('port'));
 });

var io = require('socket.io').listen(server);
/**
 * Socket.io event handling
 */
require('./app/socketHandler.js')(io, streams);

const db = require('./config/dbconfig');
db.getDB().query(`SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))`);