annoCtrl.controller('BooksCtrl', ['$scope', '$routeParams', '$modal', '$timeout', 'UserService', 'SerializeService', function($scope, $routeParams, $modal, $timeout, UserService, SerializeService) {

  // Save user data after login
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

}]).controller('SearchBookCtrl', ['$scope', '$modalInstance', '$location', '$http', 'BookService', 'user', function($scope, $modalInstance, $location, $http, BookService, user) {
  $scope.searchBook = function(query) {
    if (!query.match(/^\d{8}$/)) {  // search by keyword
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