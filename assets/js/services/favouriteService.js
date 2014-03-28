app.factory('FavouriteService', ['$rootScope', function($rootScope) {
  // use chrome.storage.sync to save data
  var storage = chrome.storage.sync
    , STORAGE_STAR = $rootScope.user.id + '_favourites'
  return {
    getState: function(note, cb) {
      this.fetchAll(function(favourites) {
        var is_faved = false
        _.each(favourites, function(n) {
          if (n.id == note.id) {
            is_faved = true
          }
        })
        cb(is_faved)
      })
    },
    star: function(note, cb) {
      this.fetchAll(function(favourites) {
        favourites.push(note)
        var item = {}
        item[STORAGE_STAR] = favourites
        storage.set(item, function() {
          cb({ is_starred: true })
        })
      })
    },
    unstar: function(note, cb) {
      this.fetchAll(function(favourites) {
        favourites = favourites.filter(function(n) {
          return n.id != note.id
        })
        var item = {}
        item[STORAGE_STAR] = favourites
        storage.set(item, function() {
          cb({ is_starred: false })
        })
      })
    },
    fetchAll: function(callback) {
      storage.get( STORAGE_STAR , function(resp) {
        if (resp && resp[STORAGE_STAR]) {
          callback(resp[STORAGE_STAR])
        } else {
          callback([])
        }
      })
    }
  }
}])