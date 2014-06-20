annoCtrl.controller('EditorCtrl', ['$scope', '$routeParams', '$http', '$location', 'UserService', 'BookService', 'NoteService', 'TranslateService', function($scope, $routeParams, $http, $location, UserService, BookService, NoteService, TranslateService) {
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
      chapter: $scope.note.chapter,
      privacy: $scope.note.privacy
    }
      , last_photo = $scope.note.last_photo
    $scope.note.page_no && (payload['page'] = $scope.note.page_no)
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