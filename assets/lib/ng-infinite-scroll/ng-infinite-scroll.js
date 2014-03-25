/* ng-infinite-scroll - v1.0.0 - 2013-02-23 */
var mod;

mod = angular.module('infinite-scroll', []);

mod.directive('infiniteScroll', [
  '$rootScope', '$timeout', function($rootScope, $timeout) {
    return {
      link: function(scope, elem, attrs) {
        var scrollElemSel = attrs.scrollElemSel || 'body'
          , scrollElem = document.querySelector(scrollElemSel)
          , $scrollElem = angular.element(scrollElem)

        var checkWhenEnabled, handler, scrollDistance, scrollEnabled;
        scrollDistance = 0;
        if (attrs.infiniteScrollDistance != null) {
          scope.$watch(attrs.infiniteScrollDistance, function(value) {
            return scrollDistance = parseInt(value, 10);
          });
        }
        scrollEnabled = true;
        checkWhenEnabled = false;
        if (attrs.infiniteScrollDisabled != null) {
          scope.$watch(attrs.infiniteScrollDisabled, function(value) {
            scrollEnabled = !value;
            if (scrollEnabled && checkWhenEnabled) {
              checkWhenEnabled = false;
              return handler();
            }
          });
        }
        handler = function() {
          var elementBottom, remaining, shouldScroll, windowBottom;
          windowBottom = scrollElem.clientHeight + scrollElem.scrollTop;
          elementBottom = elem[0].offsetTop + elem[0].clientHeight;
          remaining = elementBottom - windowBottom;
          shouldScroll = remaining <= scrollElem.clientHeight * scrollDistance;
          if (shouldScroll && scrollEnabled) {
            if ($rootScope.$$phase) {
              return scope.$eval(attrs.infiniteScroll);
            } else {
              return scope.$apply(attrs.infiniteScroll);
            }
          } else if (shouldScroll) {
            return checkWhenEnabled = true;
          }
        };
        $scrollElem.on('scroll', _.throttle(handler, 200));
        scope.$on('$destroy', function() {
          return $scrollElem.off('scroll', handler);
        });
        return $timeout((function() {
          if (attrs.infiniteScrollImmediateCheck) {
            if (scope.$eval(attrs.infiniteScrollImmediateCheck)) {
              return handler();
            }
          } else {
            return handler();
          }
        }), 0);
      }
    };
  }
]);
