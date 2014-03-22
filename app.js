
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , conf = require('./conf')
  , mongoose = require('mongoose')
  , passport = require('./lib/passport')

  , app = express()

// all environments
app.set('port', process.env.PORT || 3000)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.json())
app.use(express.urlencoded())
app.use(express.methodOverride())
app.use(express.cookieParser('Secret Cat'))
app.use(express.session())
app.use(passport.initialize())
app.use(passport.session())

// app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(app.router)

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler())
}

mongoose.connect(conf.database.uri)

routes(app)

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'))
})
