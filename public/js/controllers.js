'use strict'

angular.module('ANNO.controllers', []).
  controller('LoginCtrl', ['$scope', '$window', function($scope, $window) {
    $scope.reload = function() {
      $window.location.href = '/auth'
    }
  }])
  .controller('appFrameCtrl', ['$scope', '$location', 'UserService', function($scope, $location, UserService) {
    $scope.asideVisible = 0
    $scope.toggleSidebar = function() {
      $scope.asideVisible ^= 1
    }
    $scope.$on('$routeChangeStart', function() {
      // $scope.user = null
      $scope.lastBook = null
    })
    $scope.$on('nav:lastBook', function(e, author, book) {
      // $scope.user = user
      $scope.author = author
      $scope.lastBook = book
    })
    $scope.$on('mode:change', function(e, mode) {
      $scope.headerInvisible = (mode == 'note' || mode == 'editor')
      $scope.globalCSSClass = 'global_' + mode
    })
    $scope.getUserAvatar = function() {
      return {
        'background-image': $scope.user? ('url(' + $scope.user.avatar+ ')'): ''
      }
    }
    $scope.logout = function() {
      if (confirm('确定要登出吗？下次登陆将需要重新授权。')) {
        UserService.logout()
        $location.path('/login')
      }
    }
  }])
  .controller('InfoCtrl', ['$scope', 'UserService', 'SerializeService', function($scope, UserService, SerializeService) {
    $scope.$emit('mode:change', 'info')
    UserService.getUserInfo().success(function(user) {
      $scope.user = user

      SerializeService.fetchAll($scope.user.id).then(function(resp) {
        var books = resp[0]
          , notes = resp[1]

        $scope.total_books = _.size(books)
        var max = 0, max_id
        _.each(books, function(book, bid) {
          if (book.notes_count > max) {
            max = book.notes_count
            max_id = bid
          }
        })
        $scope.max_book = books[max_id]

        $scope.total_notes = notes.length
        var start, start_bid, start_nid
          , end, end_id
          , time
        start = end = new Date(notes[0].time)
        _.each(notes, function(note, nid) {
          time = new Date(note.time)
          if (time < start) {
            start = time
            start_bid = note.book_id
            start_nid = nid
          }
          if (time > end) {
            end = time
            end_id = nid
          }
        })
        $scope.start = start.toLocaleDateString()
        $scope.end = end.toLocaleDateString()
        $scope.start_book = books[start_bid]
        $scope.start_note = notes[start_nid]

        _.sortBy(notes, function(note) {
          return new Date(note.time)
        })
        $scope.recent_books = _.map(notes.slice(0, 5), function(note) {
          return books[note.book_id]
        })

      })
    })
  }])
  .controller('BooksCtrl', ['$scope', '$routeParams','$location', '$modal', 'UserService', 'SerializeService', function($scope, $routeParams, $location, $modal, UserService, SerializeService) {
    $scope.$emit('mode:change', 'books')

    // Save user data after login
    // var user = UserService.login()
    var uid = $routeParams.uid
    UserService.getUser(uid).then(function(user) {
      // fetch books
      SerializeService.fetchAllBooks(user.id).then(function(books) {
        $scope.books = books
        $scope.user = user
        $scope.tipVisible = !user.is_self && _.isEmpty(books)
      })

      $scope.searchBook = function() {
        var modalInstance = $modal.open({
          templateUrl: 'modalSearchBook.html',
          controller: function($scope, $modalInstance) {
            $scope.ok = function (bid) {
              $location.path('/' + user.uid + '/book/' + bid +'/new')
              $modalInstance.close()
            }
            $scope.cancel = function () {
              $modalInstance.dismiss('cancel')
            }
          },
          resolve: function() {

          }
        })
      }
    })

  }])
  .controller('BookCtrl', ['$scope', '$routeParams', '$modal', 'UserService', 'SerializeService', 'TranslateService', function($scope, $routeParams, $modal, UserService, SerializeService, TranslateService) {
    $scope.$emit('mode:change', 'book')

    var books, book, notes
      , user
      , uid = $routeParams.uid
      , bid = $routeParams.bid
      , self = UserService.login()

    UserService.getUser(uid).then(function(user) {
      // retrieve book
      $scope.dominateColor = {
        background: '#fff',
        foreground: '#000'
      }
      $scope.author = user
      SerializeService.fetchBook(user.id, bid).then(function(book) {
        $scope.user = self
        $scope.book = book
        $scope.order = 'time'
        $scope.reverse = true
        $scope.book_cover = '/cover/' + book.images.large.match(/\/([^\/]*\.jpg)/)[1]
      })


      $scope.book_opened = 0
      $scope.openBook = function() {
        $scope.book_opened ^= 1
      }

      $scope.exportNotes = function() {
        SerializeService.fetchBook(user.id, bid).then(function(book) {
          var exports
          exports = book.notes.map(function(note) {
            return (note.chapter? ('#' + note.chapter + '\n\n') : '')
                 + TranslateService.doubanToMarkdown(note.content, note.photos)
          }).join('\n\n-----\n\n')

          var modalInstance = $modal.open({
            templateUrl: 'modalExport.html',
            controller: function($scope, $modalInstance) {
              $scope.download = function () {
                if ($scope.exportFormat == 'markdown') {
                  var blob = new Blob([exports], {type: "text/plain;charset=utf-8"})
                  saveAs(blob, book.title + ".md")
                } else if ($scope.exportFormat == 'html') {
                  var blob = new Blob([angular.element(document.querySelector('.preview-html')).html()], {type: "text/html;charset=utf-8"})
                  saveAs(blob, book.title + '.html')
                }
              }
              $scope.cancel = function () {
                $modalInstance.dismiss('cancel')
              }
              $scope.exports = exports
              $scope.exportFormat = 'markdown'
              $scope.changeExportFormat = function(mode) {
                $scope.exportFormat = mode
              }

            }
          })

        })
      }
    })

  }])
  .controller('NoteCtrl', ['$scope', '$http', '$routeParams', '$modal', '$location', 'UserService', 'NoteService', 'TranslateService', function($scope, $http, $routeParams, $modal, $location, UserService, NoteService, TranslateService) {
    $scope.$emit('mode:change', 'note')

    var note
      , nid = $routeParams.nid
      , user = UserService.login()
      , author

    NoteService.get({
      id: nid
    }).success(function(resp) {
      note = _.pick(resp, 'id', 'chapter', 'page_no', 'privacy', 'content', 'photos', 'last_photo')
      note.content = TranslateService.doubanToMarkdown(note.content, note.photos)
      $scope.note = note
      $scope.book = _.pick(resp.book, 'id', 'title')

      author = $scope.user = resp.author_user

      $scope.can_operate = (resp.author_id == user.id)

      $scope.$emit('nav:lastBook', author, $scope.book)
    })

    function deleteNote(id, bid) {
      return NoteService.remove({
        id: id,
        bid: $scope.book.id
      }).success(function() {
        $location.path('/' + user.uid + '/book/' + $scope.book.id)
      })
    }
    $scope.open = function() {
      var modalInstance = $modal.open({
        templateUrl: 'modalDeleteNote.html',
        controller: function($scope, $modalInstance) {
          $scope.ok = function () {
            deleteNote(nid)
            $modalInstance.close()
          }
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel')
          }
        },
        resolve: function() {
        }
      })

      modalInstance.result.then(function (selectedItem) {
        $scope.selected = selectedItem
      }, function () {
        //$log.info('Modal dismissed at: ' + new Date())
      })
    }
  }])
  .controller('FriendsCtrl', ['$scope', '$http', 'UserService', function($scope, $http, UserService) {
    $scope.$emit('mode:change', 'friends')
    var user = UserService.login()
    var start = 0
      , count = 50
      , friends = []
    function fetchFriendsList() {
      $http({
        method: 'GET',
        url: '/api/shuo/v2/users/' + user.uid + '/following',
        params: {
          start: start,
          count: count
        },
        cache: true
      }).success(function(resp) {
        Array.prototype.push.apply(friends, _.filter(resp, function(u) { return u.type == 'user' }))
        $scope.friends = friends
        start += count
        if (!resp.length) {
          $scope.and_more = false
        }
      })
    }
    fetchFriendsList()
    $scope.and_more = true
    $scope.showMoreFriends = function() {
      fetchFriendsList()
    }

  }])
  .controller('EditorCtrl', ['$scope', '$routeParams', '$http', '$location', 'UserService', 'BookService', 'NoteService', 'TranslateService', function($scope, $routeParams, $http, $location, UserService, BookService, NoteService, TranslateService) {
    $scope.$emit('mode:change', 'editor')

    var user = UserService.login()
      , note
    if ($routeParams.nid) { // update note
      var nid = $routeParams.nid

      $scope.action = 'put'

      $scope.note = NoteService.get({
        id: nid
      }).success(function(resp) {
        note = _.pick(resp, 'id', 'chapter', 'page_no', 'privacy', 'content', 'book_id', 'photos', 'last_photo', 'book')
        note.content = TranslateService.doubanToMarkdown(note.content, note.photos)
        note.privacy = note.privacy == '2'? 'public': 'private'
        $scope.note = note
        $scope.$emit('nav:lastBook', user, _.pick(resp.book, 'id', 'title'))
      })
    } else if ($routeParams.bid) { // create new note
      $scope.note = {
        chapter: '',
        content: '',
        page_no: null,
        photos: {},
        privacy: 'public'
      }
      $scope.action = 'post'
      BookService.get($routeParams.bid).then(function(book) {
        $scope.note.book = book
        $scope.$emit('nav:lastBook', user, book)
      })
    }
    $scope.mode = 'column-mode'
    $scope.changeMode = function(mode) {
      $scope.mode = mode
    }

    $scope.images = []
    $scope.save = function() {
      var payload = {
        content: TranslateService.markdownToDouban($scope.note.content),
        page: $scope.note.page_no,
        chapter: $scope.note.chapter,
        privacy: $scope.note.privacy
      }
        , last_photo = $scope.note.last_photo
      if ($scope.action == 'put') {
        NoteService.put({
          id: $routeParams.nid
        }, payload, $scope.images).success(function(note) {
          $location.path('/note/' + note.id)
        })
      } else if ($scope.action == 'post') {
        NoteService.post({
          bid: $routeParams.bid
        }, payload, $scope.images).success(function(note) {
          $location.path('/note/' + note.id)
        })
      }
    }

  }])
  .controller('SearchBookCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.searchBook = function(query) {
      $http.get('/api/v2/book/search', {
        params: {
          q: query
        }
      }).success(function(res) {
        // console.log(res)
        $scope.books = res.books
      })
    }
    $scope.selectBook = function($index, book) {
      $scope.selectedIndex = $index
      $scope.selectedBook = book
    }
  }])