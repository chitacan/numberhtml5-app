var port = "/dev/tty.bluetooth-Bailey";

var init = function() {
  chrome.serial.open(port, function(cInfo) {
    startReading(cInfo);
  });
}

var startTime;
var bytesRead;

var startReading = function(cInfo) {
  startTime=Date.now(); 
  read(cInfo);
}

var read = function(cInfo) {
  chrome.serial.read(cInfo.connectionId, 24, function(data) {
    bytesRead+=data.bytesRead;
    var elapsed=Date.now-startTime;
    if (elapsed<20000) {
      read(cInfo);
    } else {
      console.log("read "+bytesRead+" in "+elapsed+" ms");
    }
  });
}

init();
