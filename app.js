var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var cors = require('cors')
var dotenv = require('dotenv').config()
var indexRouter = require('./routes/index');
var mongoose = require('mongoose');
const uuidv1 = require('uuid/v4');

//global variables
global.responseHelper = require('./controller/helper/responseHelper');
global.uuidv1 = uuidv1;
var app = express();

//required for cors
app.use(cors())

// required for passport
app.use(session({
  secret: process.env.SECRET, // session secret
  resave: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 30
  }
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
require('./config/passport')(passport);

var configDB = require('./config/database');

// configuration ===================================
mongoose.connect(configDB.url,{useNewUrlParser:true}); // connect to our database

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(responseHelper.error(404,'No route found'));
});

module.exports = app;
