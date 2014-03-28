annoCtrl.controller('FriendsCtrl', ['$scope', '$http', 'FriendsService', function($scope, $http, FriendsService) {
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