// for packaged app
app.factory('FileSystemService', [function() {
  function errorHandler(e) {
    console.error(e);
  }
  function waitForIO(writer, callback) {
    // set a watchdog to avoid eventual locking:
    var start = Date.now();
    // wait for a few seconds
    var reentrant = function() {
      if (writer.readyState===writer.WRITING && Date.now()-start<4000) {
        setTimeout(reentrant, 100);
        return;
      }
      if (writer.readyState===writer.WRITING) {
        console.error("Write operation taking too long, aborting!"+
                      " (current writer readyState is "+writer.readyState+")");
        writer.abort();
      }
      else {
        callback();
      }
    };
    setTimeout(reentrant, 100);
  }
  function writeEntry(writableEntry, opt_blob, callback) {

    writableEntry.createWriter(function(writer) {

      writer.onerror = errorHandler;
      writer.onwriteend = callback;

      // If we have data, write it to the file. Otherwise, just use the file we
      // loaded.
      if (opt_blob) {
        writer.truncate(opt_blob.size);
        waitForIO(writer, function() {
          writer.seek(0);
          writer.write(opt_blob);
        });
      }
    }, errorHandler);
  }
  return {
    'save': function(blob, filename, extension, callback) {
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
}])