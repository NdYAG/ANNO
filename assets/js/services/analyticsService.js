app.factory('AnalyticsService', ['$q', function($q) {
  var service = analytics.getService(GAConf.service)
    , tracker = service.getTracker(GAConf.tracker)

  var configDefer = new $q.defer()
  service.getConfig().addCallback(function(config) {
    configDefer.resolve(config)
  })
  return {
    isTrackingPermitted: function() {
      var defer = new $q.defer()
      configDefer.promise.then(function(config) {
        defer.resolve(config.isTrackingPermitted())
      })
      return defer.promise
    },
    setTrackingPermission: function(isTrackingPermitted) {
      configDefer.promise.then(function(config) {
        config.setTrackingPermitted(isTrackingPermitted)
      })
    },
    sendAppView: function(view) {
      tracker.sendEvent('ChangeView', 'Change', view)
    },
    reportError: function(error) {
      tracker.sendEvent('Error', String(error.id), error.msg)
    }
  }
}])