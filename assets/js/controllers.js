'use strict'

angular.module('ANNO.controllers', ['infinite-scroll']).
  controller('LoginCtrl', ['$scope', '$window', 'AuthService', function($scope, $window, AuthService) {
    $scope.reload = function() {
      $window.location.href = '/auth'
    }
    $scope.getToken = AuthService.auth
  }])
  .controller('appFrameCtrl', ['$scope', '$rootScope', '$location', '$modal', '$compile', 'UserService', function($scope, $rootScope, $location, $modal, $compile, UserService) {
    $scope.asideVisible = 0
    $scope.toggleSidebar = function() {
      $scope.asideVisible ^= 1
    }
    $scope.$on('$routeChangeStart', function() {
      $scope.lastBook = null
      $scope.globalTitle = ''
    })
    $scope.$on('nav:lastBook', function(e, author, book) {
      $scope.author = author
      $scope.lastBook = book
    })
    $scope.$on('page:change', function(e, mode, title) {
      $scope.headerInvisible = (mode == 'note' || mode == 'editor')
      $scope.globalCSSClass = 'global_' + mode
      $scope.globalTitle = title || ''
    })

    $scope.logout = function() {
      var modalInstance = $modal.open({
        templateUrl: 'modalLogout.html',
        controller: function($scope, $modalInstance) {
          $scope.ok = function (bid) {
            UserService.logout(function() {
              $location.path('/login')
              $modalInstance.close()
            })
          }
          $scope.cancel = function () {
            $modalInstance.dismiss('cancel')
          }
        }
      })
    }
  }])
  .controller('InfoCtrl', ['$scope', 'AuthService', 'UserService', 'SerializeService', function($scope, AuthService, UserService, SerializeService) {
    $scope.$emit('page:change', 'info', '个人信息')

    UserService.getUserInfo().then(function(user) {
      $scope.user = user

      SerializeService.fetchAll(user.id).then(function(resp) {
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

        // find first five unique
        var note_group = _.groupBy(notes, function(note) { return note.book_id })
        $scope.recent_books = _.map(_.sortBy(_.values(note_group), function(notes) {return new Date(notes[0].time) }).reverse().slice(0,5), function(notes) {return books[notes[0].book_id] })

      })
    })

    AuthService.isEvernoteAuthed().then(function(type) {
      $scope[type + '_bound'] = true
    })
    $scope.authEvernote = function(type) {
      // type: evernote or yinxiang
      AuthService.evernote(type, function() {
        $scope[type + '_bound'] = true
        $scope.$apply()
      })
    }
    $scope.unbind = function(type) {
      AuthService.unbindEvernote(type, function() {
        $scope[type + '_bound'] = false
        $scope.$apply()
      })
    }
  }])
  .controller('BooksCtrl', ['$scope', '$routeParams', '$modal', '$timeout', 'UserService', 'SerializeService', function($scope, $routeParams, $modal, $timeout, UserService, SerializeService) {

    // Save user data after login
    // var user = UserService.login()
    var uid = $routeParams.uid

    UserService.getUser(uid).then(function(user) {
      $scope.user = user
      $scope.$emit('page:change', 'books', (user.name || '我') + '的书架')
      // fetch books
      SerializeService.fetchAllBooks(user.id).then(function(books) {
        $scope.books = books
        $scope.tipVisible = !user.is_self && _.isEmpty(books)
      })

      $scope.searchBook = function() {
        var modalInstance = $modal.open({
          templateUrl: 'modalSearchBook.html',
          controller: 'SearchBookCtrl',
          resolve: {
            'user': function() {
              return user
            }
          }
        }).opened.then(function() {
          $timeout(function() {
            // not that way angular
            var firstInput = $('.modal-dialog input[type="text"]')
            if (firstInput.length) {
              firstInput[0].focus()
            }
          }, 50)
        })
      }
    })

  }])
  .controller('BookCtrl', ['$scope', '$routeParams', '$modal', '$timeout', 'UserService', 'SerializeService', 'TranslateService', 'FileSystemService', function($scope, $routeParams, $modal, $timeout, UserService, SerializeService, TranslateService, FileSystemService) {

    var books, book, notes
      , uid = $routeParams.uid
      , bid = $routeParams.bid
    UserService.login().then(function(user) {
      $scope.user = user
    })
    UserService.getUser(uid).then(function(user) {
      // retrieve book
      $scope.dominateColor = {
        background: '#fff',
        foreground: '#000'
      }
      $scope.author = user
      SerializeService.fetchBook(user.id, bid).then(function(book) {
        $scope.$emit('page:change', 'book', (user.name? '<a link="/' + user.uid + '">' + user.name + '的书架</a> ❯ ' : '') + book.title)
        $scope.book = book
        $scope.order = 'time'
        $scope.reverse = true
        $scope.book_cover = book.images.large
      })


      $scope.book_opened = 0
      $scope.openBook = function() {
        $scope.book_opened = 1
      }
      $scope.closeBook = function() {
        $scope.book_opened = 0
      }
      $scope.book_sided = false
      $scope.$watch('dominateColor', function(colors) {
        if (colors.background != '#fff') { // after processed by color thief, background will be rgb. Thus #fff means color thief has not stealed the color
          $scope.book_sided = true
        }
      })

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
                  // saveAs(blob, book.title + ".md")
                  FileSystemService.save(blob, book.title, 'md', function(is_saved) {
                    is_saved && $modalInstance.close()
                  })
                } else if ($scope.exportFormat == 'html') {
                  var blob = new Blob([angular.element(document.querySelector('.preview-html')).html()], {type: "text/html;charset=utf-8"})
                  // saveAs(blob, book.title + '.html')
                  FileSystemService.save(blob, book.title, 'html', function(is_saved) {
                    is_saved && $modalInstance.close()
                  })
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

              $scope.popupEvernote = function() {
                $modal.open({
                  templateUrl: 'modalEvernote.html',
                  controller: 'EvernoteCtrl',
                  resolve: {
                    title: function() {
                      return book.title
                    }
                  },
                  windowClass: 'mask-evernote'
                })
              }

            }
          })

        })
      }
    })

  }])
  .controller('NoteCtrl', ['$scope', '$http', '$routeParams', '$modal', '$location', 'UserService', 'NoteService', 'TranslateService', 'FavouriteService', 'EvernoteService', function($scope, $http, $routeParams, $modal, $location, UserService, NoteService, TranslateService, FavouriteService, EvernoteService) {
    $scope.$emit('page:change', 'note')

    var note
      , nid = $routeParams.nid

    UserService.login().then(function(user) {
      NoteService.get({
        id: nid
      }).success(function(resp) {
        note = _.pick(resp, 'id', 'chapter', 'page_no', 'privacy', 'summary',  'content', 'photos', 'last_photo')
        note.content = TranslateService.doubanToMarkdown(note.content, note.photos)
        $scope.note = note
        $scope.book = _.pick(resp.book, 'id', 'title')

        $scope.author = resp.author_user

        $scope.can_operate = (resp.author_id == user.id)

        $scope.$emit('nav:lastBook', $scope.author, $scope.book)

        FavouriteService.getState(note, function(state) {
          $scope.has_starred = state
          $scope.$apply()
        })
        $scope.toggleStar = function(state) {
          FavouriteService[state? 'star': 'unstar'](_.omit(note, 'content'), function(state) {
            $scope.has_starred = state.is_starred
            $scope.$apply()
          })
        }
        $scope.popupEvernote = function() {
          var modalInstance = $modal.open({
            templateUrl: 'modalEvernote.html',
            controller: 'EvernoteCtrl',
            resolve: {
              title: function() {
                return (note.chapter || (book.title + '第' + note.page_no + '页'))
              }
            }
          })
        }
      }).catch(function(error) {
        $scope.error = error
      })

    })
    function deleteNote(id, bid) {
      return NoteService.remove({
        id: id,
        bid: $scope.book.id
      }).success(function() {
        $location.path('/' + $scope.user.uid + '/book/' + $scope.book.id)
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

      modalInstance.result.then(function(selectedItem){
        $scope.selected = selectedItem
      })
    }
  }])
  .controller('FriendsCtrl', ['$scope', '$http', 'FriendsService', function($scope, $http, FriendsService) {
    $scope.$emit('page:change', 'friends', '友邻的笔记')

    $scope.showMoreFriends = function() {
      FriendsService.getMore().then(function(friends) {
        $scope.and_more = FriendsService.has_more
      })
    }

    $scope.friends = FriendsService.getAllLocal()
    $scope.and_more = FriendsService.has_more

    if (!$scope.friends.length) {
      $scope.showMoreFriends()
    }
  }])
  .controller('EditorCtrl', ['$scope', '$routeParams', '$http', '$location', 'UserService', 'BookService', 'NoteService', 'TranslateService', function($scope, $routeParams, $http, $location, UserService, BookService, NoteService, TranslateService) {
    $scope.$emit('page:change', 'editor')

    UserService.login().then(function(user) {
      var note
      if ($routeParams.nid) { // update note
        var nid = $routeParams.nid

        $scope.action = 'put'

        $scope.note = NoteService.get({
          id: nid
        }).success(function(resp) {
          note = _.pick(resp, 'id', 'chapter', 'page_no', 'privacy', 'content', 'book_id', 'photos', 'last_photo', 'book')
          note.page_no = note.page_no || null // api returns 0, turn it to null
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
    })

    $scope.mode = 'column-mode'
    $scope.changeMode = function(mode) {
      $scope.mode = mode
    }

    $scope.is_fullscreen = 0
    $scope.fullscreen = function() {
      if ($scope.is_fullscreen) {
        chrome.app.window.current().restore()
      } else {
        chrome.app.window.current().fullscreen()
      }
      $scope.is_fullscreen ^= 1
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
  .controller('FavCtrl', ['$scope', 'FavouriteService', function($scope, FavouriteService) {
    $scope.$emit('page:change', 'fav', '我收藏的笔记*')
    FavouriteService.fetchAll(function(notes) {
      $scope.notes = notes
    })
  }])
  .controller('SearchBookCtrl', ['$scope', '$modalInstance', '$location', '$http', 'BookService', 'user', function($scope, $modalInstance, $location, $http, BookService, user) {
    $scope.searchBook = function(query) { // search by keyword
      if (!query.match(/^\d{8}$/)) {
        $http.get('/api/v2/book/search', {
          params: {
            q: query
          }
        }).success(function(res) {
          $scope.books = res.books
          if (res.books.length) {
            $scope.selectedIndex = 0
            $scope.selectedBook = res.books[0]
          }
        })
      } else { // fetch book by subject id
        BookService.get(query).then(function(book) {
          $scope.selectedIndex = 0
          $scope.selectedBook = book
          $scope.books = [book]
        })
      }
      $scope.has_searched = true
    }
    $scope.selectBook = function($index, book) {
      $scope.selectedIndex = $index
      $scope.selectedBook = book
    }
    $scope.ok = function (bid) {
      $location.path('/' + user.uid + '/book/' + bid +'/new')
      $modalInstance.close()
    }
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel')
    }
  }])
  .controller('EvernoteCtrl', ['$scope', '$rootScope', '$modalInstance', 'EvernoteService', 'title', function($scope, $rootScope, $modalInstance, EvernoteService, title) {
    var STATUS = {
      'NOTEBOOK': {
        'PENDING': '正在获取Evernote笔记本列表...',
        'SUCCESS': '',
        'FAIL': '与Evernote服务器通信失败，请检查Internet是否正常。'
      },
      'NOTE': {
        'PENDING': '正在保存',
        'SUCCESS': '',
        'FAIL': '保存失败，请检查Internet是否正常，或者关闭窗口重试一次。'
      }
    }
    $scope.status = STATUS.NOTEBOOK.PENDING
    EvernoteService.listNoteBooks(function(res) {
      $scope.notebooks = Array.prototype.slice.call(res, 0) // [{name: ,quid:}]
      $scope.selectedNotebook = $scope.notebooks[0]
      $scope.status = STATUS.NOTEBOOK.SUCCESS
      $scope.$apply()
    }, function() {
      $scope.status = STATUS.NOTEBOOK.FAIL
      $scope.$apply()
    })
    $scope.choice_notebook = 'exist'

    function saveNoteTo(notebook) {
      EvernoteService.save(title
                          , $('.content')
                          , notebook.guid
                          , function() {
                            $rootScope.$broadcast('alert:success', '保存成功 :)')
                            $modalInstance.close()
                          }
                          , function(msg) {
                            $scope.status = STATUS.NOTE.FAIL + (msg && ('错误:' + msg + ' 告知开发者让他修复吧:)'))
                            $scope.$apply()
                          })
    }
    $scope.ok = function(choice, existbook, newbook) {
      if (choice == 'exist') {
        saveNoteTo(existbook)
      } else if (choice == 'new') {
        EvernoteService.createNoteBook(newbook, function(newbook) {
          saveNoteTo(newbook)
        })
      }
    }
    $scope.cancel = function() {
      $modalInstance.close()
    }
  }])
