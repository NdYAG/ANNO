app.factory('BookService', ['$q', '$http', '$rootScope', function($q, $http, $rootScope) {
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