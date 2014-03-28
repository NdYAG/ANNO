app.factory('NoteService', ['$http', '$rootScope', 'UserService', function($http, $rootScope, UserService) {
  var user = $rootScope.user
    , id = user.id
    , STORAGE_BOOK = id + '_books'
    , STORAGE_NOTE = id + '_notes'
  var buildFormData = function(payload, files) {
      var formData = new FormData()
      _.each(payload, function(val, key) {
        formData.append(key, val)
      })
      _.each(files, function(file) {
        formData.append(file.name, file.obj)
      })
      return formData
  }

  function increaseNoteCount(bid, delta) {
    delta = delta || 1
    var books = JSON.parse(sessionStorage.getItem(STORAGE_BOOK))
      , book = books[bid]
    if (book) {
      book.notes_count += delta
      sessionStorage.setItem(STORAGE_BOOK, JSON.stringify(books))
    }
  }
  return {
    get: function(params) {
      return $http.get('/api/v2/book/annotation/' + params.id)
    },
    put: function(params, payload, photos) {
      var formData = buildFormData(payload, photos)
      return $http.put('/api/v2/book/annotation/' + params.id, formData, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).success(function(note) {
        var notes = sessionStorage.getItem(STORAGE_NOTE)
        if (notes) {
          notes = JSON.parse(notes)
          notes.forEach(function(n, i) {
            if (n.id == note.id) {
              notes[i] = note
            }
          })
          sessionStorage.setItem(STORAGE_NOTE, JSON.stringify(notes))
        }
      })
    },
    post: function(params, payload, photos) {
      var formData = buildFormData(payload, photos)
      return $http.post('/api/v2/book/' + params.bid + '/annotations', formData, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).success(function(note) {
        var notes = sessionStorage.getItem(STORAGE_NOTE)
        if (notes) {
          notes = JSON.parse(notes)
          notes.push(note)
          sessionStorage.setItem(STORAGE_NOTE, JSON.stringify(notes))

          increaseNoteCount(note.book_id)
        }
      })
    },
    remove: function(params) {
      var id = params.id
        , bid = params.bid
      return $http.delete('/api/v2/book/annotation/' + id).success(function() {
        var notes = sessionStorage.getItem(STORAGE_NOTE)
        if (notes) {
          notes = JSON.parse(notes)
          notes = notes.filter(function(note) {
            return note.id != id
          })
          sessionStorage.setItem(STORAGE_NOTE, JSON.stringify(notes))

          increaseNoteCount(bid, -1)
        }
      })
    }
  }
}])