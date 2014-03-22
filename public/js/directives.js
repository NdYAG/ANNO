'use strict'

angular.module('ANNO.directives', [])
.directive('inputEnter', function() {
  var ENTER_KEY = 13
  return function (scope, elem, attrs) {
    elem.bind('keydown', function (event) {
      if (event.keyCode === ENTER_KEY) {
        scope.$apply(attrs.inputEnter)
      }
    })
  }
})
.directive('editor', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/partials/widgets/editor.html',
    scope: {
      article: "=", // data bind this property with a property in parent scope
      images: "="
    },
    controller: function($scope) {
      var utils = {
        bold: function(s, editor) {
          if (s.charAt(0) === '*' && s.charAt(s.length - 1 === '*')) {
            editor.replaceSelection(s.replace(/\*/g, ''));
          } else {
            editor.replaceSelection('**' + s.replace(/\*/g, '') + '**');
          }
        },
        italic: function(s, editor) {
          if (s.charAt(0) === '_' && s.charAt(s.length - 1 === '_')) {
            editor.replaceSelection(s.replace(/_/g, ''));
          } else {
            editor.replaceSelection('_' + s.replace(/_/g, '') + '_');
          }
        },
        quote: function(s, editor) {
          if (s.charAt(0) === '>') {
            editor.replaceSelection(util.lTrim(s.replace(/\>/g, '')));
          } else {
            editor.replaceSelection('> ' + s.replace(/\>/g, ''));
          }
        }
      }
      var self = this
      this.codeMirrorLoad = function(editor) {
        $scope.bold = function() {
          if (editor.getSelection() !== '') utils.bold(editor.getSelection(), editor)
        }
        $scope.italic = function() {
          if (editor.getSelection() !== '') utils.italic(editor.getSelection(), editor)
        }
        $scope.quote = function() {
          if (editor.getSelection() !== '') utils.quote(editor.getSelection(), editor)
        }
        self.uploadPhoto = function(dataURL, file) {
          ++$scope.article.last_photo

          $scope.images.push({
            name: 'pic' + ($scope.article.last_photo || 1),
            src: dataURL,
            obj: file
          })

          editor.replaceSelection('<图片' + $scope.article.last_photo + '>')
        }
        $scope.toggleEditorHelp = function() {

        }
      }

    }
  }
})
.directive('codemirror', function() {
  return {
    restrict: 'E',
    require: ['^editor', 'ngModel'],
    replace: true,
    link: function(scope, elem, attrs, ctrls) {
      var editorCtrl = ctrls[0]
        , ngModel = ctrls[1]

      var editor = new CodeMirror(elem[0], {
        mode: 'gfm',
        // value: 'initial text\n\n```javascript\nconsole.log("simon")\n```',
        lineWrapping: true,
        lineNumbers: false,
        matchBrackets: true,
        autofocus: true,
        theme: 'prose-bright',
        placeholder: '开始写笔记'
      })
      editor.refresh()
      editor.on('change', function(cm) {
        var phase = scope.$root.$$phase
        if(phase == '$apply' || phase == '$digest') {
          ngModel.$setViewValue(cm.getValue())
        } else {
          scope.$apply(function(){
            ngModel.$setViewValue(cm.getValue())
          })
        }
        // scope.$apply(function() {
        //   ngModel.$setViewValue(cm.getValue())
        // })
      })
      ngModel.$render = function() {
        if (!ngModel.$viewValue) return
        editor.setValue(ngModel.$viewValue)
      }

      editorCtrl.codeMirrorLoad(editor)
      //ngModel.$setViewValue(editor.getValue())
    }
  }
})
.directive('filereader', function() {
  return {
    restrict: 'A',
    require: '^editor',
    link: function(scope, elem, attrs, editorCtrl) {
      var reader = new FileReader()
      reader.onload = function (e) {
        // editorCtrl.photos.push(e.target.result)
        editorCtrl.uploadPhoto(e.target.result, elem[0].files[0])
      }

      elem.on('change', function() {
        reader.readAsDataURL(elem[0].files[0])
      })
    }
  }
})
.directive('reader', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/partials/widgets/reader.html',
    scope: {
      article: "=",
      images: "="
    },
    controller: function($scope) {
      this.images = $scope.images
    }
  }
})
.directive('previewer', function() {
  return {
    restrict: 'E',
    scope: {
      markdown: '=',
      images: '='
    },
    template: '<div class="content">{{markdown}}</div>',
    replace: true,
    require: '^?reader',
    link: function(scope, elem, attrs, readerCtrl) {
      marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
      })
      scope.$watch('markdown', function(text) {
        if (_.isUndefined(text)) return
        elem.html(marked(text))
        ;[].slice.call(elem.find('pre'), 0).forEach(function(block) {
          // hljs.highlightBlock(block)
          var $block = angular.element(block)
          CodeMirror.runMode($block.text(), $block.find('code').attr('class').slice(5), block)
          $block.addClass('cm-s-prose-bright')
        })

        elem.html(elem.html().replace(/\&lt;图片(\d+)\&gt;/g, function(wholeMatch, m1) {
          var img = _.findWhere(scope.images, { name: 'pic' + m1 })
          return '<img src="' + img.src + '" />'
        }))
      })

    }
  }
})
.directive('loader', ['$rootScope', '$timeout', function($rootScope, $timeout) {
  return function(scope, elem, attrs) {
    scope.$on('loading:show', function() {
      elem.css('display', 'block').removeClass('fadeOut')
    })
    scope.$on('loading:hide', function() {
      elem.addClass('fadeOut')
      $timeout(function() {
        elem.css('display', 'none')
      }, 1000)
    })
  }
}])
.directive('alert', ['$rootScope', function($rootScope) {
  return function(scope, elem, attrs) {
    var ERROR = {
        '103': '访问令牌出错，需要<a href="/#/login">重新授权登录</a>',
        '111': '访问太频繁，超出第三方应用限额',
        '999': '未知错误',
        '1000': '这篇笔记是私密的，只能阅读到简介部分，不能显示全文。',
        '1001': '内容不存在，<a href="/#/">回到首页</a>',
        '1002': '必要的信息还没填完，请检查标题和内容是否填写',
        '1003': '上传图片太大，不能大于3M',
        '1004': '有违禁词',
        '1005': '输入的正文太短，要求超过15个字',
        '1008': '不支持上传图片的格式',
        // error from proxy
        '10000': '授权令牌失效了，<a href="/#/login/">点这里重新授权登录</a>'
    }
    scope.$on('alert:error', function(e, data) {
      var msg = ERROR[data.code]
      if (!msg) {
        if (data.code) {
          msg = '你遇到了编号为' + data.code + '的错误"' + data.msg +'", <a href="http://www.douban.com/doumail/write?to=1662222" target="_blank">告诉管理员让他修一修吧。</a>'
        } else {
          msg = '发生了奇怪的错误，可能是服务器不稳定，稍后再试试吧。<a href="http://www.douban.com/doumail/write?to=1662222" target="_blank">告诉管理员</a>'
        }
      }
      elem.addClass('error').addClass('show').html(msg)
    })
    elem.on('click', function() {
      elem.removeClass('show')
    })
    scope.$on('alert:dismiss', function(e) {
      elem.removeClass('show')
    })
  }
}])
.directive('colorThief', [function() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attrs, ngModel) {
      var colorThief = new ColorThief()
        , sourceImage = new Image

      scope.$watch(attrs.image, function(url) {
        sourceImage.src = url
        sourceImage.onload = function() {
          var rgb = colorThief.getColor(sourceImage)
            , luma = 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2]
          ngModel.$setViewValue({
            'image': url,
            'background': 'rgb(' + rgb.join(',') + ')',
            'foreground': luma>192? '#000': '#fff'
          })
        }
      })
    }
  }
}])