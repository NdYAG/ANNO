var EvernoteAuth = (function() {
  'use strict'

  var conf = EvernoteAuthConf
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
        url: conf.hostname + '/oauth?oauth_consumer_key=' + conf.consumer_key +
          '&oauth_signature=' + conf.consumer_secret + "%26" +
          '&oauth_signature_method=PLAINTEXT' +
          '&oauth_timestamp=' + (new Date).valueOf() +
          '&oauth_nonce' + (new Date).valueOf() +
          '&oauth_callback=' + encodeURIComponent(redirectURL)
      }
      // oauth step1: get temporary credential
      var xhr = new XMLHttpRequest()
      xhr.open('GET', options.url)
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
      xhr.onload = function() {
        if (this.status === 200) {
          var resp = parseRedirectFragment(this.responseText)
          console.log(resp)
          if (!resp.oauth_callback_confirmed) return
          chrome.identity.launchWebAuthFlow({
            interactive: true,
            url: conf.hostname + '/OAuth.action?oauth_token=' + resp.oauth_token
          }, function(redirectUri) {
            console.log('launchWebAuthFlow completed', chrome.runtime.lastError, redirectUri)
            if (chrome.runtime.lastError) {
              callback(new Error(chrome.runtime.lastError))
              return
            }
            var matches = redirectUri.match(redirectRe)
            if (matches && matches.length > 1)
              handleProviderResponse(resp, parseRedirectFragment(redirectUri))
            else
              callback(new Error('Invalid redirect URI'))
          })
        }
      }
      xhr.send()

      function parseRedirectFragment(fragment, options) {
        var pairs = fragment.split(/&/);
        var values = {};

        pairs.forEach(function(pair) {
          var nameval = pair.split(/=/);
          if (options && options.decode) {
            values[nameval[0]] = decodeURIComponent(nameval[1]);
          } else {
            values[nameval[0]] = nameval[1];
          }
        });

        return values;
      }

      function handleProviderResponse(values, values2) {
        console.log('providerResponse', values);
        if (values.hasOwnProperty('access_token'))
          setAccessToken(values.access_token);
        // oauth step2: exhange temporary credentials for token
        else if (values.hasOwnProperty('oauth_token'))
          exchangeCodeForToken(values.oauth_token, values2.oauth_verifier);
        else
          callback(new Error('Neither access_token nor code avialable.'));
      }

      function exchangeCodeForToken(token, verifier) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST',
                 conf.hostname + '/oauth?' +
                 'oauth_consumer_key=' + conf.consumer_key +
                 '&oauth_signature=' + conf.consumer_secret + "%26" +
                 '&oauth_signature_method=PLAINTEXT' +
                 '&oauth_timestamp=' + (new Date).valueOf() +
                 '&oauth_nonce=' + (new Date).valueOf() +
                 '&oauth_token=' + token +
                 '&oauth_verifier=' + verifier);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
          if (this.status === 200) {
            // var response = JSON.parse(this.responseText);
            var response = parseRedirectFragment(this.responseText, {decode: true});
            console.log(response);
            if (response.hasOwnProperty('oauth_token')) {
              callback(null, response)
              // setAccessToken(response.oauth_token);
              // save notestore url
              // save(decodeURIComponent(response.edam_noteStoreUrl))
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
      // function setAccessToken(token) {
      //   access_token = token;
      //   console.log('Setting access_token: ', access_token);
      //   callback(null, access_token);
      // }

    }
  }

})()