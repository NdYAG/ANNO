app.factory('EvernoteService', ['$rootScope', function($rootScope) {
  var user = $rootScope.user
    , conf = user.evernote || user.yinxiang

  if (!conf) return {}

  var noteStoreURL = conf.edam_noteStoreUrl
    , authenticationToken = conf.oauth_token
    , noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL)
    , noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport)
    , noteStore = new NoteStoreClient(noteStoreProtocol)
  return {
    listNoteBooks: function(done, fail) {
      noteStore.listNotebooks(authenticationToken, function (notebooks) {
        done && done(notebooks)
      }, function onerror(error) {
        fail(error)
      })
    },
    createNoteBook: function(name, callback) {
      this.listNoteBooks(function(notebooks) {
        var notebook = _.filter(notebooks, function(nb) {
          return nb.name == name
        })
        if (!notebook.length) {
          var nnb = new Notebook()
          nnb.name = name
          noteStore.createNotebook(authenticationToken, nnb, function(res) {
            callback && callback(res)
          })
        } else {
          callback && callback(notebook[0])
        }
      })
    },
    save: function(title, content_node, notebook_id, done, fail) {
      var note = new Note
      note.title = title
      note.content = '<?xml version=\"1.0\" encoding=\"UTF-8\"?><!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\"><en-note>' + enml.html2enml(content_node[0]) + '</en-note>'
      note.notebookGuid = notebook_id
      noteStore.createNote(authenticationToken, note, function(res) {
        if (res.errorCode) {
          fail && fail(res.parameter)
        } else {
          done && done()
        }
      })
    }
  }
}])