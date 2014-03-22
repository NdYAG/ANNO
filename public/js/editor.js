// use document.querySelector(All) & angular.element
;(function(exports) {
  var $ = function(selector) {
    if (typeof selector === 'string')
      return angular.element(document.querySelectorAll(selector))
    else if (typeof selector === 'object')
      return angular.element(selector)
  }
  var editor, photos = []
  function init_codemirror() {
    editor = CodeMirror($('#code')[0], {
      mode: 'gfm',
      value: $('#text').text(),
      lineWrapping: true,
      lineNumbers: false,
      matchBrackets: true,
      autofocus: true,
      theme: 'prose-bright',
      placeholder: '开始写笔记'
    })
    editor.refresh()
  }
  function init_navigation() {
    var icons = $('#navigation a')
    icons.on('click', function(e) {
      icons.removeClass('active')
      $(e.target).addClass('active')
    })
  }
  function init_toolbar($scope) {
    $('#upload').on('change', function(e) {

      var files = Array.prototype.slice.call(this.files, 0)
        , last_photo = parseInt($('#last_photo').val(), 10)
      // Array.prototype.push.apply(photos, files)
      files.forEach(function(file) {
        photos.push(file)
        editor.replaceSelection('![desc]()\r\n\r\n'.replace('desc', '图片' + (last_photo + photos.length)), 'end')
      })

    })
  }
  function init_edit() {
    var $edit = $('.js-edit')
    $edit.on('click', function() {
      $('#reader').addClass('hidden')
      $('body').removeClass('column-mode')
    })
  }
  function init_preview() {
    var $preview = $('.js-preview')
    $preview.on('click', function() {
      var converter = new Showdown.converter()
        , text = editor.getValue()
      $('#reader .title').text($('#title').val() || "第" + $('#page_no').val() + "页")
      $('#reader .content').html(converter.makeHtml(text))
      Array.prototype.slice.call($('#reader pre code'), 0).forEach(function(codeblock) {
        hljs.highlightBlock(codeblock)
      })
      $('#reader').removeClass('hidden')
      // .css({
      //   'height': document.body.clientHeight + 'px'
      // })
      $('body').removeClass('column-mode')
    })
  }
  function init_column() {
    var $column = $('.js-columns')
    $column.on('click', function() {
      // $('#editor, #reader').addClass('columned')
      $('body').addClass('column-mode')
    })
  }
  function init_save(TranslateService, $http) {
    var $save = $('.js-save')
    $save.on('click', function() {
      var formData = new FormData()
        , last_photo = parseInt($('#last_photo').val(), 10)
      _.each({
        content: TranslateService.markdownToDouban(editor.getValue()),
        page_no: parseInt($('#page_no').val(), 10),
        chapter: $('#title').val(),
        privacy: $('[name="privacy"]:checked').val() || 'public'
      }, function(val, key) {
        formData.append(key, val)
      })
      _.each(photos, function(photo, i) {
        formData.append('pic' + (last_photo + 1), photo)
      })

      var action = JSON.parse($save.attr('data-ajax'))
      $http[action.method](action.url, formData, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      }).success(function(res) {
        // response is object (JSON parsed by angular's $http)
        var notes = JSON.parse(localStorage.getItem('notes'))
          , new_note = _.pick(res, 'id', 'book_id', 'chapter', 'time', 'summary', 'content', 'privacy', 'page_no', 'last_photo', 'photos')
          , old_note_existed = false
        _.each(notes, function(note, i) {
          if (note.id == new_note.id) {
            old_note_existed = true
            notes[i] = new_note
          }
        })

        if (!old_note_existed) {
          notes.push(new_note)
          // todo: update book's note count
        }

        localStorage.setItem('notes', JSON.stringify(notes))

      })

    })
  }

  exports.prose = {
    init: function($scope, $http, TranslateService) {
      // init_codemirror()

      init_navigation()
      init_toolbar($scope)
      init_edit()
      init_preview()
      init_column()

      init_save(TranslateService, $http)
    }
  }
})(window)