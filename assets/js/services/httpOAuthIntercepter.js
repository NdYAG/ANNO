app.factory('HttpOAuthIntercepter', ['$q', '$rootScope', function($q, $rootScope) {
  return {
    request: function(req) {
      if (req.url.indexOf('/api') == 0) { // api.douban.com
        req.headers['Authorization'] = 'Bearer ' + $rootScope.user.token
        req.url = 'https://api.douban.com' + req.url.slice(4)
      }
      return req
    }
  }
}])