chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    'minWidth': 860,
    'minHeight': 580,
    'bounds': {
      'width': 960,
      'height': 600
    }
  });
});
