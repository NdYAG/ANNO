var passport = require('passport')
  , douban = require('passport-douban')
  , conf = require('../conf/')
  , _ = require('underscore')

  , User = require('../models/user')

passport.use(new douban.Strategy({
  clientID: conf.oauth.key,
  clientSecret: conf.oauth.secret,
  callbackURL: conf.site.url + '/auth/callback'
}, linkUser))

// username, douban_id, evernote_account
function linkUser(accessToken, refreshToken, params, profile, done) {
  var userinfo = _.extend(_.pick(profile._json, 'id', 'uid', 'name', 'avatar', 'large_avatar'), {accessToken: accessToken})
  User.update({ $where: "this.douban.id == " + profile._json.id },
              { douban: userinfo },
              { upsert: true },
              function(err, num) {
                done(null, _.extend(userinfo, {expires_in: params.expires_in}))
              })
}

passport.serializeUser(function(user, done) {
  // console.log('serializing')
  done(null, user)
});

passport.deserializeUser(function(user, done) {
  // console.log('deserializing')
  done(null, user);
});

module.exports = passport
