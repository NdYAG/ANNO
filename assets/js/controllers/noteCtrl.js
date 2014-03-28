annoCtrl.controller('NoteCtrl', ['$scope', '$http', '$routeParams', '$modal', '$location', 'UserService', 'NoteService', 'TranslateService', 'FavouriteService', 'EvernoteService', function($scope, $http, $routeParams, $modal, $location, UserService, NoteService, TranslateService, FavouriteService, EvernoteService) {
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