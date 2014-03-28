annoCtrl.controller('LoginCtrl', ['$scope', '$window', 'AuthService', function($scope, $window, AuthService) {
  $scope.reload = function() {
    $window.location.href = '/auth'
  }
  $scope.getToken = AuthService.auth
}])