'use strict'

angular.module('ANNO.ui-directives', [])
.directive('scrollHide', [function() {
  return function(scope, elem, attrs) {
    var hideFrom = attrs.hideFrom || 10
      , target = window

    if (attrs.targetSel) {
      target = document.querySelector(attrs.targetSel)
    }

    if (attrs.hideFrom) {
      scope.$watch(attrs.hideFrom, function(value) {
        hideFrom = parseInt(value, 10)
      })
    }

    function onScroll() {
      elem.toggleClass('hide', target.scrollTop > hideFrom)
    }
    scope.hide = false

    angular.element(target).on('scroll', _.throttle(onScroll, 200))
  }
}])
