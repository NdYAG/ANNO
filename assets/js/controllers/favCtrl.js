annoCtrl.controller('FavCtrl', ['$scope', 'FavouriteService', function($scope, FavouriteService) {
  $scope.$emit('page:change', 'fav', '我收藏的笔记*')
  FavouriteService.fetchAll(function(notes) {
    $scope.notes = notes
  })
}])