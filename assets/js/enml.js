// require $ alias of angular.element
// todo: put this to translateService...
// extract style
// html to xhmlt <br> to <br/>, hr to <hr/>, img to <img/>
var enml = (function() {
  var EXTRACT_RULE = {
    'blockquote': ['border-left'],
    'span': ['color'],
    'code': ['border', 'background-color'],
    'pre': ['background-color', 'margin']
  }

  function html2enml(node) {
    var $$ = angular.element
    var clone = node.cloneNode(true)
      , process = $$('<div id="process"></div>')
      , nodeClassName = $(node).attr('class').split(' ')[0]
      , result
    $('body').append(process)
    process = $('#process')
    process.append($(clone))
    nodewalk(clone.childNodes, process_node)

    result = $('#process .' + nodeClassName).html()
             .replace(/<br>/g, '<br />')
             .replace(/<hr>/g, '<hr />')
             .replace(/<img data-src="([^>]*)">/g, '<img src="$1" />')
    process.remove()
    return result
  }

  function nodewalk(node, fn) {
    for (var i = 0; i < node.length; i++) {
      if (node[i].hasChildNodes()) { // todo: filter by node.nodeName
        nodewalk(node[i].childNodes, fn)
      }
      if (1 === node[i].nodeType) { // element
        fn(node[i])
      }
    }
  }

  function process_node(node) {
    if (node.nodeName == "IMG") {
      node.removeAttribute('src')
      node.removeAttribute('alt')
    }
    style_inline(node)
    node.removeAttribute('class')
    node.removeAttribute('id')
  }

  // example: style="color: red; background: green;"
  function style_inline(node) {
    var nodename = node.nodeName.toLowerCase()
      , rules
      , str_style
    if (nodename in EXTRACT_RULE) {
      rules = EXTRACT_RULE[nodename]
      str_style = ''
      for(var i = 0, l = rules.length, rule; i < l; i++) {
        rule = rules[i]
        str_style += rule + ':' +
          getComputedStyle(node).getPropertyValue(rule) + ';'
      }
      node.setAttribute('style', str_style)
    }
  }
  return {
    html2enml: html2enml
  }
})()
