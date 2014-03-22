var conf = require('../conf')
  , passport = require('../lib/passport')
  , User = require('../models/user')
  , utils = require('./utils')
  , proxy = require('./proxy')
  , _ = require('underscore')

module.exports = function(app) {

  app.get('/auth', passport.authenticate('douban', { scope: conf.oauth.scope }))

  app.get('/auth/callback'
         , passport.authenticate('douban', {failureRedirect: '/'})
         , function(req, res) {
             req.user.douban = _.pick(req.user, 'id', 'uid', 'name', 'avatar', 'accessToken')
             res.cookie('logintoken', JSON.stringify({
               id: req.user.id,
               uid: req.user.uid,
               avatar: req.user.large_avatar,
               token: req.user.accessToken
             }), {
               maxAge: parseInt(req.user.expires_in, 10) * 1000,
               signed: false
             })
             res.redirect('/')
           })

  app.get('/', function(req, res) {
    res.render('index')
  })

  app.get('/sandbox', function(req, res) {
    res.render('sandbox')
  })

  app.get('/cover/:uri', proxy.proxyImage)

  ;['get', 'post', 'put', 'delete'].forEach(function(method) {
    app[method](/^\/api\/(.*)/, utils.apiRequireLogin, proxy.proxyAPI)
  })

  app.get('*', function(req, res) {
    res.render('index')
  })

}