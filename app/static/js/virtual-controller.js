var VirtualController = function(options) {
  var frameID;
  var pad;
  var lastV = 0;
  var lastH = 0;
  var self = this;

  var joystick = new VirtualJoystick({
    container: document.getElementById('container'),
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
    var vertical   = joystick.deltaY() * -1;
    var horizontal = joystick.deltaX();
    
    if (vertical == 0 && horizontal == 0) {
      sendResult(0, 0);
      frameID = window.webkitRequestAnimationFrame(update);
      return;
    }

    vertical   = vertical   - (vertical   % 5);
    horizontal = horizontal - (horizontal % 5);

    if (joystick.up() || joystick.down()) {
      sendResult(vertical, vertical);
    } else if (joystick.left()) {
      sendResult(horizontal * -1, horizontal);
    } else if (joystick.right()) {
      sendResult(horizontal * -1, horizontal);
    }


    frameID = window.webkitRequestAnimationFrame(update);
  }
  frameID = window.requestAnimationFrame(update);
  this.update = update;
}
