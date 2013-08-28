chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create("static/index.html", {width:1164, height: 825});
});
