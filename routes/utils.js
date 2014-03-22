var User = require('../models/user')

exports.authLoginToken = function(req, res, next) {
  var cookie = JSON.parse(req.cookies.logintoken)
  User.findOne({
    "douban.id": cookie.id,
    "douban.accessToken": cookie.token
  }, function(err, user) {
    if (user) {
      console.log('user found in db')
      req.user = user
      next()
    } else {
      // res.redirect('/login')
      res.writeHead(400, {"Content-Type" : "application/json"})
      res.end(JSON.stringify({code:10000, msg: 'require login'}))
    }
  })
}

exports.requireLogin = function(req, res, next) {
  if (req.user) {
    // console.log('user exist in session')
    next()
  } else if (req.cookies.logintoken) {
    // console.log('user found in cookie')
    exports.authLoginToken(req, res, next)
  } else {
    res.writeHead(400, {"Content-Type" : "application/json"})
    res.end(JSON.stringify({code:10000, msg: 'require login'}))
    // res.redirect('/login')
  }
}

exports.apiRequireLogin = function(req, res, next) {
  if (req.user) {
    next()
  } else if (req.cookies.logintoken) {
    exports.authLoginToken(req, res, next)
  } else {
    res.writeHead(400, {"Content-Type" : "application/json"})
    res.end(JSON.stringify({err: 'require login'}))
  }
}
