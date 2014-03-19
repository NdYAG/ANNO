var DoubanAuth = (function() {
  'use strict'

  var conf = DoubanAuthConf
    , redirectURL = 'https://' + chrome.runtime.id + '.chromiumapp.org/auth/callback'
    , redirectRe = new RegExp(redirectURL + '[#\?](.*)')
    , access_token = null
    , userinfo

  return {
    getToken: function(callback) {
      if (access_token) {
        callback(null, access_token)
        return
      }
      var options = {
        interactive: true,
        url: 'https://www.douban.com/service/auth2/auth?client_id=' + conf.api_key +
          '&response_type=code' +
          '&redirect_uri=' + encodeURIComponent(redirectURL) +
          '&scope=' + conf.scopes
      }
      chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
        console.log('launchWebAuthFlow completed', chrome.runtime.lastError, redirectUri)
        if (chrome.runtime.lastError) {
          callback(new Error(chrome.runtime.lastError))
          return
        }
        var matches = redirectUri.match(redirectRe)
        if (matches && matches.length > 1)
          handleProviderResponse(parseRedirectFragment(matches[1]))
        else
          callback(new Error('Invalid redirect URI'))

      })
      function parseRedirectFragment(fragment) {
        var pairs = fragment.split(/&/);
        var values = {};

        pairs.forEach(function(pair) {
          var nameval = pair.split(/=/);
          values[nameval[0]] = nameval[1];
        });

        return values;
      }

      function handleProviderResponse(values) {
        console.log('providerResponse', values);
        if (values.hasOwnProperty('access_token'))
          setAccessToken(values.access_token);
        // If response does not have an access_token, it might have the code,
        // which can be used in exchange for token.
        else if (values.hasOwnProperty('code'))
          exchangeCodeForToken(values.code);
        else
          callback(new Error('Neither access_token nor code avialable.'));
      }

      function exchangeCodeForToken(code) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST',
                 'https://www.douban.com/service/auth2/token?' +
                 'client_id=' + conf.api_key +
                 '&client_secret=' + conf.api_secret +
                 '&redirect_uri=' + redirectURL +
                 '&grant_type=authorization_code' +
                 '&code=' + code);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.onload = function () {
          // When exchanging code for token, the response comes as json, which
          // can be easily parsed to an object.
          if (this.status === 200) {
            var response = JSON.parse(this.responseText);
            console.log(response);
            if (response.hasOwnProperty('access_token')) {
              setAccessToken(response.access_token);
            } else {
              callback(new Error('Cannot obtain access_token from code.'));
            }
          } else {
            console.log('code exchange status:', this.status);
            callback(new Error('Code exchange failed'));
          }
        };
        xhr.send();
      }
      function setAccessToken(token) {
        access_token = token;
        console.log('Setting access_token: ', access_token);
        callback(null, access_token);
      }

    }
  }

})()