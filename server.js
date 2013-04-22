#!/usr/bin/env node

var express = require('express');
var hash = require('./pass').hash;
var config = require('./config').config;
var fs = require('fs');
var _ = require('underscore');
var app = express();

var collectDownloads = function() {
  var downloads = [];
  var path = config.rootServerPath + '/' + config.downloadsLoc;
  fs.readdirSync(path).forEach(function(f) {
    downloads.push({
      serverpath: '/' + config.downloadsLoc + '/' + f,
      clientpath: '/' + config.downloadsLoc + '/' + f,
      filename: f
    });
  });
  return downloads;
};

// build a user database that includes salt+hash pairs instead of
// plaintext passwords

var users = {};

var addUser = function(uname, pwd) {
  hash(pwd, function(err, salt, hash) {
    if (err) {
      throw err;
    }
    users[uname] = {
      name: uname, 
      salt: salt,
      hash: hash
    };
  });
};

config.userSpecs.forEach(function(spec) {
  if (config.passwordIsUsername) {
    addUser(spec, spec);
  } else {
    spec = spec.split(' ');
    addUser(spec[0], spec[1]);
  }
});

// express config & middleware

app.set('view engine', 'hbs');
app.set('views', __dirname);

app.use(express.bodyParser());
app.use(express.cookieParser(config.cookieSecret));
app.use(express.session());

// session-persisted handlebars context

app.use(function(req, res, next) {

  var err = req.session.error;
  delete req.session.error;

  res.locals.message = err ? err : '';
  res.locals.authenticated = !!req.session.user;
  res.locals.site = config.staticSiteLoc + '/' + config.homePage;
  res.locals.sitename = config.staticSiteName;
  res.locals.passwordIsUsername = config.passwordIsUsername;
  res.locals.baseurl = req.protocol + "://" + req.get('host');

  // We should really cache this, but it's kinda
  // nice to have it update after hitting refresh.
  res.locals.files = collectDownloads();

  next();
});

// check the user database by applying salt

function authenticate(name, pass, fn) {
  var user = users[name];
  if (!user) {
    return fn(new Error('cannot find user'));
  }
  hash(pass, user.salt, function(err, hash) {
    if (err) {
      return fn(err);
    }

    // There's probably a better way to compare buffers,
    // but for now we'll convert them to strings.  If we
    // don't do this, some versions of node always fail
    // this comparison.
    if (hash.toString() == user.hash.toString()) {
      return fn(null, user);
    }

    fn(new Error('invalid password'));
  });
}

// define a validation callback for restricted areas

function restrict(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.render('index');
  }
}

// let the routing begin!

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('index');
});

app.get('/' + config.staticSiteLoc, restrict, function(req, res) {
  res.sendfile(
    config.staticSiteLoc + '/index.html',
    {root: config.rootServerPath, maxAge: null});
});

app.get('/' + config.staticSiteLoc + '/*', restrict, function(req, res) {
  res.sendfile(
    config.staticSiteLoc + '/' + req.params[0],
    {root: config.rootServerPath, maxAge: null});
});

var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

app.get('/public/*', function(req, res) {
  if (endsWith(req.params[0], '.css')) {
    res.header("Content-Type", "text/css");
  }
  res.sendfile(
    'nodehost/public/' + req.params[0],
    {root: config.rootServerPath, maxAge: null});
});

app.get('/' + config.downloadsLoc + '/:file', restrict, function(req, res) {
  var downloads = collectDownloads();
  var doc = _.findWhere(downloads, {filename: req.params.file});
  if (!doc) {
    console.error('Cannot find', req.params.file);
    return;
  }
  res.sendfile(
    doc.serverpath,
    {root: config.rootServerPath, maxAge: null});
});

app.get('/logout', function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
});

app.post('/login', function(req, res) {
  var uname = req.body[config.passwordIsUsername ? 'password' : 'username'];
  authenticate(uname, req.body.password, function(err, user) {
    if (user) {
      req.session.regenerate(function() {
        req.session.user = user;
        res.redirect('back');
      });
    } else {
      req.session.error = 'Authentication failure.';
      res.redirect('/');
    }
  });
});

app.listen(config.port);
console.log('Express started on port ' + config.port);
