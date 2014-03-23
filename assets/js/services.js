'use strict'

angular.module('ANNO')
.factory('AuthService', ['$http', '$location', function($http, $location) {
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
          chrome.storage.local.set({'logintoken': JSON.stringify({
            id: resp.id,
            uid: resp.uid,
            avatar: resp.large_avatar,
            token: access_token
          })})
          $location.path('/')
        })

      })
    }
  }
}])
.factory('UserService', function($rootScope, $http, $q) {
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
          $rootScope.user = JSON.parse(resp.logintoken)
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
.factory('SerializeService', function($q, $http, $rootScope, BookService) {
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
.factory('TranslateService', function() {
  var g_html_blocks = []
  var escapeCharacters = function(text, charsToEscape, afterBackslash) {
    var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g,"\\$1") + "])"
    if (afterBackslash) {
      regexString = "\\\\" + regexString
    }
    var regex = new RegExp(regexString,"g")
    text = text.replace(regex,escapeCharacters_callback)
    return text
  }
  var escapeCharacters_callback = function(wholeMatch,m1) {
    var charCodeToEscape = m1.charCodeAt(0)
    return "~E"+charCodeToEscape+"E"
  }
  var _EncodeCode = function(text) {
    text = text.replace(/&/g,"&amp")
    text = text.replace(/</g,"&lt")
    text = text.replace(/>/g,"&gt")
    text = escapeCharacters(text,"\*_{}[]\\",false)
    return text
  }
  var _Detab = function(text) {
    text = text.replace(/\t(?=\t)/g,"    ")
    text = text.replace(/\t/g,"~A~B")
    text = text.replace(/~B(.+?)~A/g, function(wholeMatch,m1,m2) {
      var leadingText = m1
      var numSpaces = 4 - leadingText.length % 4
      for (var i=0; i<numSpaces; i++) leadingText+=" "
      return leadingText
    })

    text = text.replace(/~A/g,"    ")
    text = text.replace(/~B/g,"")

    return text
  }
  var hashBlock = function(text) {
    text = text.replace(/(^\n+|\n+$)/g,"")
    return "\n\n~K" + (g_html_blocks.push(text)-1) + "K\n\n"
  }

  return {
    doubanToMarkdown: function(text, images) {
      if (images && !_.isEmpty(images)) {
        text = text.replace(/\<图片(\d*)\>/g, function(_, num) {
          return '![图片' + num + '](' + images[num] + ')'
        })
      }

      return text
             .replace(/\<代码开始 lang=\"(.*)\"\>(\n{0,1})/g, '```$1\n')
             .replace(/\<\/代码结束\>/g, '```')
             .replace(/\[code:(.*)\]/g, '```$1')
             .replace(/\[\/code\]/g, '```')
             .replace(/\<原文开始\>([\s\S]*?)\<\/原文结束\>/g, function(wholeMatch, m1) {
               var bq = m1
               // remove leading and trailing newlines
               bq = bq.replace(/^\n/g, "")
               //bq = bq.replace(/\n$/g, "")
               bq = bq.replace(/^([^\n|^\s])/gm, '> $1')
               return bq
             })
    },
    markdownToDouban: function(text) {
      text += '\n'
      return text.replace(/(^|\n)```(.*)\n([\s\S]*?)\n```/g, function(wholeMatch, m0, m1, m2) {
        var blank = m0
          , language = m1
          , codeblock = m2

        // codeblock = _EncodeCode(codeblock)
        codeblock = _Detab(codeblock)
        codeblock = codeblock.replace(/^\n+/g,"") // trim leading newlines
        codeblock = codeblock.replace(/\n+$/g,"") // trim trailing whitespace

        codeblock = blank + "<代码开始" + (language ? " lang=\"" + language + '"' : "") + ">\n" + codeblock + "\n</代码结束>"

        return codeblock
      }).replace(/\!\[图片(\d*)\]\((.*)\)/g, '<图片$1>')
      .replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm, function(wholeMatch, m1) {
        var bq = m1
        bq = bq.replace(/^[ \t]*>[ \t]?/gm,"~0")
        bq = bq.replace(/~0/g, "")
        bq = bq.replace(/^[ \t]+$/gm,"")
        bq = bq.replace(/\n{1,}$/, '')

        return "<原文开始>\n" + bq + "\n</原文结束>\n"
      }).replace(/\n$/g, '')
    }
  }
})
.factory('NoteService', ['$http', '$rootScope', 'UserService', function($http, $rootScope, UserService) {
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
.factory('BookService', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {
  // fetch book from sessionStorage or from $http
  return {
    get: function(bid) {
      var user = $rootScope.user
        , id = user.id

      var defer = $q.defer()
      var books = sessionStorage.getItem(id + '_books')
        , book
      if (books) {
        books = JSON.parse(books)
        book = books[bid]
      }
      if (!book) {
        $http.get('/api/v2/book/' + bid).success(function(book) {
          defer.resolve(book)
        })
      } else {
        defer.resolve(book)
      }
      return defer.promise
    }
  }
}])
.factory('FriendsService', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {

  var localData
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
      var start = getAllLocal().length
      return fetchFriendsList(start, count)
    }
  }
}])
.factory('HttpLoadingIntercepter', ['$q', '$rootScope', function($q, $rootScope) {
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
.factory('HttpOAuthIntercepter', ['$q', '$rootScope', function($q, $rootScope) {
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
.factory('FavouriteService', ['$rootScope', function($rootScope) {
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
// packaged app
.factory('FileSystemService', [function() {
  function errorHandler(e) {
    console.error(e);
  }
  function waitForIO(writer, callback) {
    // set a watchdog to avoid eventual locking:
    var start = Date.now();
    // wait for a few seconds
    var reentrant = function() {
      if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
        setTimeout(reentrant, 100);
        return;
      }
      if (writer.readyState===writer.WRITING) {
        console.error("Write operation taking too long, aborting!"+
                      " (current writer readyState is "+writer.readyState+")");
        writer.abort();
      }
      else {
        callback();
      }
    };
    setTimeout(reentrant, 100);
  }
  function writeEntry(writableEntry, opt_blob, callback) {

    writableEntry.createWriter(function(writer) {

      writer.onerror = errorHandler;
      writer.onwriteend = callback;

      // If we have data, write it to the file. Otherwise, just use the file we
      // loaded.
      if (opt_blob) {
        writer.truncate(opt_blob.size);
        waitForIO(writer, function() {
          writer.seek(0);
          writer.write(opt_blob);
        });
      }
    }, errorHandler);
  }
  return {
    'save': function(blob, filename, extension, callback) {
      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: filename,
        accepts: [{
          extensions: [extension]
        }]
      }, function(writableEntry) {
        if (!writableEntry) {
          callback(false)
          return
        }
        writeEntry(writableEntry, blob, function() {
          callback(true)
        })
      })
    }
  }
}])
