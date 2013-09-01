chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create("static/index.html", {left:0, top:0, width:720, height: 900});
});
