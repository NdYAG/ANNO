app.factory('FriendsService', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {

  var localData
    , start = 0
    , count = 50
    , has_more = true

  function getAllLocal() {
    if (!localData) {
      var id = $rootScope.user.id
      localData = sessionStorage.getItem(id + '_friends')
      localData = JSON.parse(localData)
      localData = localData || []
    }
    return localData
  }

  function fetchFriendsList(start, count) {
    var defer = $q.defer()
      , user = $rootScope.user
    $http({
      method: 'GET',
      url: '/api/shuo/v2/users/' + user.uid + '/following',
      params: {
        start: start,
        count: count
      },
      cache: true
    })
    .success(function(resp) {
      Array.prototype.push.apply(localData, _.filter(resp, function(u) { return u.type == 'user' }))
      if (!resp.length) {
        has_more = false
      }
      defer.resolve(localData)
    })
    .error(defer.reject)

    return defer.promise
  }

  return {
    friends: localData,
    has_more: has_more,
    getAllLocal: getAllLocal,
    getMore: function() {
      var promise = fetchFriendsList(start, count)
      start += count
      return promise
    }
  }
}])