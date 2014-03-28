app.factory('HttpLoadingIntercepter', ['$q', '$rootScope', function($q, $rootScope) {
  var n_loading = 0
  function isSerious(rejection) {
    if (rejection.data.type === 'text/html') {
      return false
    }
    return true
  }

  return {
    'request': function(config) {
      n_loading++
      $rootScope.$broadcast('loading:show')
      return config || $q.when(config)
    },
    'requestError': function(rejection) {
      n_loading--
      return $q.reject(rejection)
    },
    'response': function(response) {
      if (!(--n_loading)) {
        $rootScope.$broadcast('loading:hide')
      }
      return response || $q.when(response)
    },
    'responseError': function(rejection) {
      if (isSerious(rejection)) {
        $rootScope.$broadcast('alert:error', rejection.data)
      }
      if (!(--n_loading)) {
        $rootScope.$broadcast('loading:hide')
      }
      return $q.reject(rejection)
    }
  }
}])