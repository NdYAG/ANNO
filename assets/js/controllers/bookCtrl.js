annoCtrl.controller('BookCtrl', ['$scope', '$routeParams', '$modal', '$timeout', 'UserService', 'SerializeService', 'TranslateService', 'FileSystemService', function($scope, $routeParams, $modal, $timeout, UserService, SerializeService, TranslateService, FileSystemService) {

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
      $scope.$emit('page:change', 'book', (user.is_self? '<a link="/">我的书架 ❯ </a>': '<a link="/' + user.uid + '">' + user.name + '的书架</a> ❯ ') + book.title)
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
                var el = angular.element(document.querySelector('.preview-html')).clone()
                Array.prototype.slice.call(el.find('img'), 0).forEach(function(img) {
                  img = $(img)
                  img.attr('src', img.attr('data-src'))
                  img.removeAttr('data-src')
                })
                var blob = new Blob([el.html()], {type: "text/html;charset=utf-8"})
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