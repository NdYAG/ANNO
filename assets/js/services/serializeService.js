app.factory('SerializeService', function($q, $http, $rootScope, BookService) {
  function sync(url, start, count, callback) {
    sync.books = sync.books || {}
    sync.notes = sync.notes || []
    $http({
      method: 'GET',
      url: url,
      params: {
        start: start,
        count: count
      }
    }).success(function(resp) {

      var annotations = resp.annotations
        , books = sync.books
        , notes = sync.notes
        , book
      annotations.forEach(function(note) {
        notes.push(_.pick(note, 'id', 'book_id', 'chapter', 'time', 'summary', 'content', 'privacy', 'page_no', 'last_photo', 'photos'))
        book = _.pick(note.book, 'id', 'title', 'author', 'images', 'summary')
        if (!books[book.id]) {
          books[book.id] = _.extend(book, {
            notes_count: 1
          })
        } else {
          books[book.id].notes_count += 1
        }
      })
      if (annotations.length) sync(url, start+count, count, callback)
      else callback()
    })
  }
  return {
    serialize: function(id, callback) {
      sync.books = {}
      sync.notes = []
      sync('/api/v2/book/user/' + id + '/annotations', 0, 20, function() {
        sessionStorage.setItem(id+ '_books', JSON.stringify(sync.books))
        sessionStorage.setItem(id+ '_notes', JSON.stringify(sync.notes))
        callback(sync.books, sync.notes)
      })
    },
    fetchAllBooks: function(id) {
      var defer = new $q.defer()
        , books = sessionStorage.getItem(id+ '_books')
      if (books) {
        books = JSON.parse(books)
        defer.resolve(books)
      } else {
        this.serialize(id, function(books) {
          defer.resolve(books)
        })
      }
      return defer.promise
    },
    fetchBook: function(uid, bid) {
      var defer = new $q.defer()
        , books = sessionStorage.getItem(uid+ '_books')
        , book
        , notes
      if (books) {
        books = JSON.parse(books)
        book = books[bid]
      }
      if (book) { // book exist in sessionStorage
        notes = JSON.parse(sessionStorage.getItem(uid+ '_notes'))
        notes = notes.filter(function(note) {
          return note.book_id == bid
        })
        book.notes = notes
        defer.resolve(book)
      } else {
        this.serialize(uid, function(books, notes) {
          book = books[bid]
          if (book) { // book exist in user's library
            book.notes = notes.filter(function(note) {
              return note.book_id == book.id
            })
            defer.resolve(book)
          } else { // new book, never write notes for it
            BookService.get(bid).then(function(book) {
              book.notes_count = 0
              book.notes = []
              defer.resolve(book)
            })
          }
        })
      }
      return defer.promise
    },
    fetchAll: function(uid) {
      var defer = new $q.defer()
        , books = sessionStorage.getItem(uid+ '_books')
        , notes = sessionStorage.getItem(uid+ '_notes')
      if (books && notes) {
        books = JSON.parse(books)
        notes = JSON.parse(notes)
        defer.resolve([books, notes])
      } else {
        this.serialize(uid, function(books, notes) {
          defer.resolve([books, notes])
        })
      }
      return defer.promise
    }
  }

})