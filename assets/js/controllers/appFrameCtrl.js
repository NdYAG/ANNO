annoCtrl.controller('appFrameCtrl', ['$scope', '$rootScope', '$location', '$modal', '$compile', 'UserService', 'AnalyticsService', function($scope, $rootScope, $location, $modal, $compile, UserService, AnalyticsService) {
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
    AnalyticsService.sendAppView(mode)
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