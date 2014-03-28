app.factory('AuthService', ['$rootScope', '$http', '$q', '$location', function($rootScope, $http, $q, $location) {
  return {
    auth: function() {
      DoubanAuth.getToken(function(error, access_token) {
        if (error) return
        $http({
          method: 'GET',
          url: 'https://api.douban.com/v2/user/~me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          }
        }).success(function(resp) {
          chrome.storage.local.set({'logintoken': {
            id: resp.id,
            uid: resp.uid,
            avatar: resp.large_avatar,
            token: access_token
          }})
          $location.path('/')
        })

      })
    },
    evernote: function(type, callback) {
      EvernoteAuth.getToken(type, function(error, res) {
        if (!res.oauth_token) {
          return
        }
        if ($rootScope.user) {
          // set and save
          var token = {}
          token[type] = res // type: evernote or yinxiang
          chrome.storage.local.set({'logintoken': _.extend($rootScope.user, token)})
        }
        callback && callback()
      })
    },
    unbindEvernote: function(type, callback) {
      if ($rootScope.user[type]) {
        delete $rootScope.user[type]
      }
      chrome.storage.local.set({ 'logintoken': $rootScope.user }, callback)
    },
    isEvernoteAuthed: function() {
      var defer = new $q.defer()
        , valid = function(conf) {
          return (conf && conf.oauth_token && (new Date) < conf.edam_expires)
        }
      chrome.storage.local.get('logintoken', function(res) {
        var evernote = res.logintoken.evernote
          , yinxiang = res.logintoken.yinxiang
        if (valid(evernote)) {
          defer.resolve('evernote')
        } else if (valid(yinxiang)) {
          defer.resolve('yinxiang')
        } else {
          defer.reject()
        }
      })
      return defer.promise
    }
  }
}])