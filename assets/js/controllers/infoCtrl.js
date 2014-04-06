annoCtrl.controller('InfoCtrl', ['$scope', 'AuthService', 'UserService', 'SerializeService', function($scope, AuthService, UserService, SerializeService) {
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
      start_bid = notes[0].book_id
      start_nid = notes[0].id
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