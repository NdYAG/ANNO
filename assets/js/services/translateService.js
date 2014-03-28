app.factory('TranslateService', function() {
  var g_html_blocks = []
  var escapeCharacters = function(text, charsToEscape, afterBackslash) {
    var regexString = "([" + charsToEscape.replace(/([\[\]\\])/g,"\\$1") + "])"
    if (afterBackslash) {
      regexString = "\\\\" + regexString
    }
    var regex = new RegExp(regexString,"g")
    text = text.replace(regex,escapeCharacters_callback)
    return text
  }
  var escapeCharacters_callback = function(wholeMatch,m1) {
    var charCodeToEscape = m1.charCodeAt(0)
    return "~E"+charCodeToEscape+"E"
  }
  var _EncodeCode = function(text) {
    text = text.replace(/&/g,"&amp")
    text = text.replace(/</g,"&lt")
    text = text.replace(/>/g,"&gt")
    text = escapeCharacters(text,"\*_{}[]\\",false)
    return text
  }
  var _Detab = function(text) {
    text = text.replace(/\t(?=\t)/g,"    ")
    text = text.replace(/\t/g,"~A~B")
    text = text.replace(/~B(.+?)~A/g, function(wholeMatch,m1,m2) {
      var leadingText = m1
      var numSpaces = 4 - leadingText.length % 4
      for (var i=0; i<numSpaces; i++) leadingText+=" "
      return leadingText
    })

    text = text.replace(/~A/g,"    ")
    text = text.replace(/~B/g,"")

    return text
  }
  var hashBlock = function(text) {
    text = text.replace(/(^\n+|\n+$)/g,"")
    return "\n\n~K" + (g_html_blocks.push(text)-1) + "K\n\n"
  }

  return {
    doubanToMarkdown: function(text, images) {
      if (images && !_.isEmpty(images)) {
        text = text.replace(/\<图片(\d*)\>/g, function(_, num) {
          return '![图片' + num + '](' + images[num] + ')'
        })
      }

      return text
             .replace(/\<代码开始 lang=\"(.*)\"\>(\n{0,1})/g, '```$1\n')
             .replace(/\<\/代码结束\>/g, '```')
             .replace(/\[code:(.*)\]/g, '```$1')
             .replace(/\[\/code\]/g, '```')
             .replace(/\<原文开始\>([\s\S]*?)\<\/原文结束\>/g, function(wholeMatch, m1) {
               var bq = m1
               // remove leading and trailing newlines
               bq = bq.replace(/^\n/g, "")
               //bq = bq.replace(/\n$/g, "")
               bq = bq.replace(/^([^\n|^\s])/gm, '> $1')
               return bq
             })
    },
    markdownToDouban: function(text) {
      text += '\n'
      return text.replace(/(^|\n)```(.*)\n([\s\S]*?)\n```/g, function(wholeMatch, m0, m1, m2) {
        var blank = m0
          , language = m1
          , codeblock = m2

        // codeblock = _EncodeCode(codeblock)
        codeblock = _Detab(codeblock)
        codeblock = codeblock.replace(/^\n+/g,"") // trim leading newlines
        codeblock = codeblock.replace(/\n+$/g,"") // trim trailing whitespace

        codeblock = blank + "<代码开始" + (language ? " lang=\"" + language + '"' : "") + ">\n" + codeblock + "\n</代码结束>"

        return codeblock
      }).replace(/\!\[图片(\d*)\]\((.*)\)/g, '<图片$1>')
      .replace(/((^[ \t]*>[ \t]?.+\n(.+\n)*\n*)+)/gm, function(wholeMatch, m1) {
        var bq = m1
        bq = bq.replace(/^[ \t]*>[ \t]?/gm,"~0")
        bq = bq.replace(/~0/g, "")
        bq = bq.replace(/^[ \t]+$/gm,"")
        bq = bq.replace(/\n{1,}$/, '')

        return "<原文开始>\n" + bq + "\n</原文结束>\n"
      }).replace(/\n$/g, '')
    }
  }
})