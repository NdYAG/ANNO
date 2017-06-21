app.factory('FileSystemService', [function() {
  if (chrome.fileSystem.chooseEntry) {
    return makeServiceForChrome()
  } else {
    return makeServiceForElectron()
  }
}])

function makeServiceForChrome() {
  function errorHandler(e) {
    console.error(e)
  }
  function waitForIO(writer, callback) {
    var start = Date.now()
    var reentrant = function() {
      if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
        setTimeout(reentrant, 100)
        return
      }
      if (writer.readyState===writer.WRITING) {
        console.error("Write operation taking too long, aborting!"+
                      " (current writer readyState is "+writer.readyState+")")
        writer.abort()
      }
      else {
        callback()
      }
    }
    setTimeout(reentrant, 100)
  }
  function writeEntry(writableEntry, opt_blob, callback) {

    writableEntry.createWriter(function(writer) {

      writer.onerror = errorHandler
      writer.onwriteend = callback

      if (opt_blob) {
        writer.truncate(opt_blob.size)
        waitForIO(writer, function() {
          writer.seek(0)
          writer.write(opt_blob)
        })
      }
    }, errorHandler)
  }
  return {
    save: function(content, filename, extension, callback) {
      var type = 'text/plain;charset=utf-8'
      if (extension === 'html') {
        type = 'text/html;charset=utf-8'
      }
      var blob = new Blob([content], { type: type })
      chrome.fileSystem.chooseEntry({
        type: 'saveFile',
        suggestedName: filename,
        accepts: [{
          extensions: [extension]
        }]
      }, function(writableEntry) {
        if (!writableEntry) {
          callback(false)
          return
        }
        writeEntry(writableEntry, blob, function() {
          callback(true)
        })
      })
    }
  }
}

function makeServiceForElectron() {
  var electron = require('electron')
  var BrowserWindow = electron.remote.BrowserWindow
  var dialog = electron.remote.dialog
  var fs = require('fs')
  return {
    save: function (content, filename, extension, callback) {
      dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
        defaultPath: filename + '.' + extension,
      }, function(filename) {
        if (!filename) {
          callback(false)
          return
        }
        fs.writeFile(filename, content, function(err) {
          callback(err? false: true)
        })
      })
    }
  }
}
