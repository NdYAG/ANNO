var https = require('https')
  , querystring = require('querystring')
  , _ = require('underscore')
  , fs = require('fs')

var DoubanAPI = function(token) {
  this.token = token,
  this._host = 'api.douban.com'
}
DoubanAPI.prototype.setToken = function(token) {
  this.token = token
}
DoubanAPI.prototype.request = function(url, data, method, callback) {
  var options = {
    hostname: this._host,
    path: '/v2' + url,
    headers: {
      'Authorization': 'Bearer ' + this.token
    },
    method: method
  }
  var req = https.request(options, function(res) {
    res.setEncoding('utf8')
    var result = ''
    res.on('data', function(chunk) {
      result += chunk
    }).on('end', function() {
      console.log('dapi-code: ' + res.statusCode)
      callback(null, result)
    }).on('error', function(err) {
      console.log('res err')
      callback(err, res)
    })
  }).on('error', function(err) {
    console.log('req err')
    callback(err)
  })
  if (_.contains(["post", "put"], method) && data) {
    req.setHeader('Content-Type', 'application/x-www-form-urlencoded')
    // if contain images, try pipe
    req.write(querystring.stringify(data))
    // req.write(querystring.encode(data))
  }
  req.end()
}

;['get', 'delete'].forEach(function(method) {
  DoubanAPI.prototype[method] = function(url, data, callback) {
    if (_.isFunction(data)) {
      callback = data
      data = null
    }
    this.request(url + '?' + querystring.stringify(data), null, method.toUpperCase(), callback)
  }
})

;['post', 'put'].forEach(function(method) {
  DoubanAPI.prototype[method] = function(url, data, files, callback) {
    if (!callback) {
      callback = files
      this.request(url, data, method, callback)
    } else {
      this.multipartRequest(url, data, files, method, callback)
    }
  }
})

module.exports = new DoubanAPI()
