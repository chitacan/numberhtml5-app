var VirtualController = function(options) {
  var frameID;
  var pad;
  var lastV = 0;
  var lastH = 0;
  var self = this;

  var joystick = new VirtualJoystick({
    container: document.getElementById('status'),
    mouseSupport: true
  });

  var update = function() {
    var stick = [joystick.deltaX(), joystick.deltaY()];

    var vertical   = Math.floor(stick[1] * 100);
    var horizontal = Math.floor(stick[0] * 100);

    vertical   = vertical   - (vertical   % 5);
    horizontal = horizontal - (horizontal % 5);

    if (vertical   < 10 && vertical   > -10) vertical   = 0;
    if (horizontal < 10 && horizontal > -10) horizontal = 0;

    if (Math.abs(lastV - vertical) > 10) {
      options.OnVertical(vertical);
      lastV = vertical;
      console.log('vertical : ' + vertical);
    }

    if (Math.abs(lastH - horizontal) > 10) {
      options.OnVertical(horizontal);
      lastV = horizontal;
      console.log('horizontal' + horizontal);
    }

    frameID = window.webkitRequestAnimationFrame(update);
  }
  frameID = window.requestAnimationFrame(update);

  this.update = update;
}
