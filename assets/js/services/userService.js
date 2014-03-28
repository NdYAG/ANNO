app.factory('UserService', function($rootScope, $http, $q) {
  return {
    isLoggedIn: function() {
      var defer = new $q.defer()
      chrome.storage.local.get('logintoken', function(resp) {
        if ((!_.isEmpty(resp)) && resp.logintoken) {
          defer.resolve()
        } else {
          defer.reject()
        }
      })
      return defer.promise
    },
    // isLoggedIn: !!chrome.storage.local.get('logintoken'),
    getUser: function(uid) {
      var defer = new $q.defer()
        , self = this
      this.login().then(function(user) {
        uid = uid || user.uid
        if (user.uid == uid) {
          user.is_self = true
          defer.resolve(user)
        } else {
          self.getUserInfo(uid).then(function(user) {
            user.is_self = false
            defer.resolve(_.pick(user, 'id', 'uid', 'name'))
          })
        }
      }, function() {
        defer.reject()
      })
      return defer.promise
    },
    getUserInfo: function(uid) {
      var defer = new $q.defer()

      this.login().then(function(user) {
        uid = uid || user.uid
        $http({
          method: 'GET',
          url: '/api/v2/user/' + uid,
          cache: true
        }).success(function(userinfo) {
          defer.resolve(userinfo)
        })
      }, function() {
        defer.reject()
      })
      return defer.promise
    },
    login: function() {
      var defer = new $q.defer()
      chrome.storage.local.get('logintoken', function(resp) {
        if (resp.logintoken) {
          $rootScope.user = resp.logintoken
          defer.resolve($rootScope.user)
        } else {
          defer.reject()
        }
      })
      return defer.promise
    },
    logout: function(callback) {
      chrome.storage.local.remove('logintoken', function() {
        $rootScope.user = null
        callback()
      })
    }
  }
})