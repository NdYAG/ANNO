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
.directive('editor', ['$modal', function($modal) {
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
          $scope.article.last_photo = $scope.article.last_photo || 0
          ++$scope.article.last_photo

          $scope.images.push({
            name: 'pic' + $scope.article.last_photo,
            src: dataURL,
            obj: file
          })

          editor.replaceSelection('<图片' + $scope.article.last_photo + '>')
        }
        $scope.toggleEditorHelp = function() {
          var modalInstance = $modal.open({
            templateUrl: 'modalEditorHelp.html',
            controller: function($scope, $modalInstance) {
              $scope.ok = function (bid) { $modalInstance.close() }
            }
          })
        }

      }

    }
  }
}])
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
.directive('previewer', ['$timeout', '$http', function($timeout, $http) {
  var imageCache = {}
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
      var renderer = new marked.Renderer()
      renderer.image = function (href, title, text) {
        var out = '<img data-src="' + href + '" alt="' + text + '"'
        if (title) {
          out += ' title="' + title + '"'
        }
        out += this.options.xhtml ? '/>' : '>'
        return out
      }
      renderer.link = function(href, title, text) {
        if (this.options.sanitize) {
          try {
            var prot = decodeURIComponent(unescape(href))
                       .replace(/[^\w:]/g, '')
                       .toLowerCase();
          } catch (e) {
            return '';
          }
          if (prot.indexOf('javascript:') === 0) {
            return '';
          }
        }
        var out = '<a href="' + href + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += ' target="_blank" >' + text + '</a>';
        return out;
      }
      marked.setOptions({
        renderer: renderer,
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
      })
      scope.$watch('markdown', function(text) {
        if (_.isUndefined(text)) return

        elem.html(marked(text))
        // $compile(elem.html())(scope)

        var MIME = {
          'c': 'text/x-csrc',
          'cpp': 'text/x-c++src',
          'csharp': 'text/x-csharp',
          'java': 'text/x-java',
          'lisp': 'text/x-common-lisp'
        }
        Array.prototype.slice.call(elem.find('pre'), 0).forEach(function(block) {
          var $block = $(block)
            , $code = $block.find('code')
          if ($code.attr('class')) {
            var mode = $code.attr('class').slice(5)
            mode = MIME[mode] || mode
            CodeMirror.runMode($block.text(), mode, block)
            $block.addClass('cm-s-prose-bright')
          }
        })

        // existed image
        Array.prototype.slice.call(elem.find('img'), 0).forEach(function(img){
          var $img = $(img)
            , source = $img.attr('data-src')
          if (!imageCache[source]) {
            $http.get($img.attr('data-src'), { 'responseType': 'blob' , 'cache': true}).success(function(blob) {
              imageCache[source] = window.URL.createObjectURL(blob)
              // $(img) becomes a document fragment, confused..
              // console.log($img)
              // console.log(elem)
              // console.log(elem.find('img'))
              Array.prototype.slice.call(elem.find('img'), 0).forEach(function(new_img) {
                $(new_img).attr('src', imageCache[source])
              })
            })
          } else {
            $img.attr('src', imageCache[source])
          }
        })
        // inserted image
        elem.html(elem.html().replace(/\&lt;图片(\d+)\&gt;/g, function(wholeMatch, m1) {
          var img = _.findWhere(scope.images, { name: 'pic' + m1 })
          return '<img src="' + img.src + '" />'
        }))

      })

    }
  }
}])
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
.directive('alert', ['$rootScope', '$timeout', '$compile', function($rootScope, $timeout, $compile) {
  return function(scope, elem, attrs) {
    var ERROR = {
        '103': '访问令牌出错，需要<a link="/login">重新授权登录</a>',
        '106': '访问令牌过期，需要<a link="/login">重新登录</a>',
        '111': '访问太频繁，超出第三方应用限额',
        '999': '未知错误',
        '1000': '<a link="/">这篇笔记是私密的，只能阅读到简介部分，不能显示全文。点我返回书架</a>',
        '1001': '内容不存在，<a link="/">回到我的书架</a>',
        '1002': '必要的信息还没填完，请检查标题和内容是否填写',
        '1003': '上传图片太大，不能大于3M',
        '1004': '有违禁词',
        '1005': '输入的正文太短，要求超过15个字',
        '1008': '不支持上传图片的格式'
    }
    scope.$on('alert:error', function(e, data) {
      var msg = ERROR[data.code]
      if (!msg) {
        if (data.code) {
          msg = '你遇到了编号为' + data.code + '的错误"' + data.msg
        } else {
          msg = '发生了奇怪的错误，可能是服务器不稳定，稍后再试试吧。<a href="http://www.douban.com/doumail/write?to=1662222" target="_blank">告诉管理员让他修复错误吧。</a>'
        }
      }
      elem.removeClass('success').addClass('error').addClass('show').html(msg)
      // compile link directive inside
      var link = elem.find('a')
      if (link.length) {
        link.replaceWith($compile(link[0].outerHTML)(scope))
      }
    })

    scope.$on('alert:success', function(e, msg) {
      elem.removeClass('error').addClass('success').addClass('show').html(msg)
      $timeout(function() {
        scope.$emit('alert:dismiss')
      }, 2000)
    })

    scope.$on('alert:dismiss', function(e) {
      elem.removeClass('show')
    })

    elem.on('click', function(e) {
      elem.removeClass('show')
    })

    scope.$on('alert:error:hide', elem.removeClass.bind(elem, 'show'))
    $rootScope.$on('$routeChangeStart', scope.$emit.bind(scope, 'alert:error:hide'))
  }
}])
.directive('colorThief', ['$http', function($http) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attrs, ngModel) {
      var colorThief = new ColorThief()
        , sourceImage = new Image

      scope.$watch(attrs.image, function(url) {
        if (!url) return
        $http.get(url, {responseType: 'blob', cache: 'true'}).success(function(blob) {
          sourceImage.src = window.URL.createObjectURL(blob)
        })
        sourceImage.onload = function() {
          var rgb = colorThief.getColor(sourceImage)
            , luma = 0.2126*rgb[0] + 0.7152*rgb[1] + 0.0722*rgb[2]
          ngModel.$setViewValue({
            'background': 'rgb(' + rgb.join(',') + ')',
            'foreground': luma>192? '#000': '#fff'
          })
        }
      })
    }
  }
}])
// packaged app specific directive
.directive("link", function ($location) {
  return function (scope, element, attrs) {
    element.bind("click", function () {
      scope.$apply($location.path(attrs.link))
    });
  }
})
.directive('compile', ['$compile', function ($compile) {
  return function(scope, element, attrs) {
    scope.$watch(
      function(scope) {
        return scope.$eval(attrs.compile)
      },
      function(value) {
        element.html(value)
        $compile(element.contents())(scope)
      })
  }
}])
.directive("remoteImage", ['$http', function($http) {
  function fetchImage(scope, elem, url) {
    $http.get(url, {responseType: 'blob', cache: true}).success(function(blob) {
      if (elem[0].nodeName === 'IMG') {
        elem.attr('src', window.URL.createObjectURL(blob))

      } else {
        elem.css({
          'background-image': 'url(' + window.URL.createObjectURL(blob) + ')'
        })
      }
    })
  }
  return {
    link: function(scope, elem, attrs) {
      scope.$watch(attrs.remoteImage, function(url) {
        if (!url) return
        fetchImage(scope, elem, url)
      })
    }
  }
}])
