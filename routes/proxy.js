var https = require('https')
  , http = require('http')
  , url = require('url')
  , _ = require('underscore')
  , querystring = require('querystring')

exports.proxyImage = function(req, res) {
  req.pause()
  var connector = http.request({
    hostname: 'img3.douban.com',
    path: '/lpic/' + req.params.uri,
    method: req.method
  }, function(resp) {
    resp.pause()
    res.writeHeader(resp.statusCode, resp.headers)
    resp.pipe(res)
    resp.resume()
  })
  req.pipe(connector)
  req.resume()
}

exports.proxyAPI = function(req, res) {
  req.pause()
  var uri = req.params[0]

  var content_type = req.headers['content-type']

  var options = {
    hostname: 'api.douban.com',
    path: '/' + uri,
    headers: {
      'Authorization': 'Bearer ' + req.user.douban.accessToken
      // 'Authorization': 'Bearer ' + 'test'
    },
    method: req.method
  }
  if (req.query) {
    options.path += '?' + querystring.stringify(req.query)
  }
  if (content_type) {
    options.headers['content-type'] = content_type
  }

  var connector = https.request(options, function(resp) {
    // console.log(resp)
    resp.pause()
    res.writeHeader(resp.statusCode, resp.headers)
    resp.pipe(res)
    resp.resume()
  })
  req.pipe(connector)
  req.resume()
}
