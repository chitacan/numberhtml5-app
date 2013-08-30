var VirtualController = function(options) {
  var frameID;
  var pad;
  var lastV = 0;
  var lastH = 0;
  var self = this;

  var joystick = new VirtualJoystick({
    container: document.getElementById('status'),
  });

  var sendResult = function(vertical, horizontal) {
    if (Math.abs(lastV - vertical) > 5) {
      options.OnVertical(vertical);
      lastV = vertical;
      console.log('ver : ' + vertical);
    }

    if (Math.abs(lastH - horizontal) > 5) {
      options.OnHorizontal(horizontal);
      lastH = horizontal;
      console.log('hor : ' + horizontal);
    }
  }

  var update = function() {
    var vertical   = joystick.deltaX() * 10;
    var horizontal = joystick.deltaY() * 10;

    vertical   = vertical   - (vertical   % 5);
    horizontal = horizontal - (horizontal % 5);

    if (vertical == 0 && horizontal == 0) {
      sendResult(0, 0);
    }

    if (joystick.up()) {
      sendResult(vertical, vertical);
    } else if (joystick.down()) {
      sendResult(vertical, vertical);
    }


    frameID = window.webkitRequestAnimationFrame(update);
  }
  frameID = window.requestAnimationFrame(update);

  this.update = update;
}
