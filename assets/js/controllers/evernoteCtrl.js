annoCtrl.controller('EvernoteCtrl', ['$scope', '$rootScope', '$modalInstance', 'EvernoteService', 'title', function($scope, $rootScope, $modalInstance, EvernoteService, title) {
  var STATUS = {
    'NOTEBOOK': {
      'PENDING': '正在获取Evernote笔记本列表...',
      'SUCCESS': '',
      'FAIL': '与Evernote服务器通信失败，请检查Internet是否正常。'
    },
    'NOTE': {
      'PENDING': '正在保存',
      'SUCCESS': '',
      'FAIL': '保存失败，请检查Internet是否正常，或者关闭窗口重试一次。'
    }
  }
  $scope.status = STATUS.NOTEBOOK.PENDING
  EvernoteService.listNoteBooks(function(res) {
    $scope.notebooks = Array.prototype.slice.call(res, 0) // [{name: ,quid:}]
    $scope.selectedNotebook = $scope.notebooks[0]
    $scope.status = STATUS.NOTEBOOK.SUCCESS
    $scope.$apply()
  }, function() {
    $scope.status = STATUS.NOTEBOOK.FAIL
    $scope.$apply()
  })
  $scope.choice_notebook = 'exist'

  function saveNoteTo(notebook) {
    EvernoteService.save(title
                        , $('.content')
                        , notebook.guid
                        , function() {
                          $rootScope.$broadcast('alert:success', '保存成功 :)')
                          $modalInstance.close()
                        }
                        , function(msg) {
                          $scope.status = STATUS.NOTE.FAIL + (msg && ('错误:' + msg + ' 告知开发者让他修复吧:)'))
                          $scope.$apply()
                        })
  }
  $scope.ok = function(choice, existbook, newbook) {
    if (choice == 'exist') {
      saveNoteTo(existbook)
    } else if (choice == 'new') {
      EvernoteService.createNoteBook(newbook, function(newbook) {
        saveNoteTo(newbook)
      })
    }
  }
  $scope.cancel = function() {
    $modalInstance.close()
  }
}])