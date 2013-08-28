/**
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
**/

const SENSOR_REFRESH_INTERVAL=2000;

window.Robot=(function() {
  
  var sensorListeners={};

  var btnConnectNXT=document.querySelector(".connectnxt");
  var btnClose=document.querySelector(".closenxt");
  var btnStop=document.querySelector(".stop");
  var btnForward=document.querySelector(".forward");
  var logArea=document.querySelector(".log");
  var statusLine=document.querySelector("#statusLine");
  
  var logObj=function(obj) {
    console.log(obj);
  }
  var logSuccess=function(msg) {
    log("<span style='color: green;'>"+msg+"</span>");
  };
  var logError=function(msg) {
    statusLine.className="error";
    statusLine.textContent=msg;
    log("<span style='color: red;'>"+msg+"</span>");
  }

  var log=function(msg) {
    console.log(msg);
    logArea.innerHTML=msg+"<br/>"+logArea.innerHTML;
  }
  
  var sensorReaderInterval;
  var startSensorReader=function() {
    if (!sensorReaderInterval) {
      console.log("starting sensor polling");
      sensorReaderInterval=window.setInterval(readAllSensors, SENSOR_REFRESH_INTERVAL);
    } 
  }
  var stopSensorReader=function() {
    window.clearInterval(sensorReaderInterval);
    sensorReaderInterval=null;
  }

  var readAllSensors=function() {
    readSensor(0);
    readSensor(2);
    //readSensor(3);
    //readServo(0);
  }
  
  var init=function() {
    if (typeof(serial_lib) === 'undefined') throw "You must include serial.js before";

    flipState(true);
    btnClose.addEventListener("click", closeSerial);
    btnForward.addEventListener("click", forward);
    btnStop.addEventListener("click", stop);
    
    document.querySelector(".read1").addEventListener("click", function() { 
        // port 0: light - percent of full scale
        setInputPort(0, 3, 0x00);
        // port 1: 
        // port 2: sound DBa - percent of full scale
        setInputPort(2, 7, 0x80);
        // port 3: switch - boolean
        setInputPort(3, 1, 0x00);
        startSensorReader();
    });
  }

  var onSensor=function(sensorType, context, callback) {
    if (sensorListeners[sensorType]) {
      throw "Only one listener per sensorType is allowed: "+sensorType;
    }
    sensorListeners[sensorType]={"callback": callback, "context": context};
  }

  var getBestMode=function(portType) {
    switch (portType) {
    case 1: return 0x20;  // switch: boolean
    case 2: return 0xC0;  // temperature: fahrenheit
    case 3: return 0x00;  // reflection: raw mode
    case 4: return 0xE0;  // angle: angle steps
    case 5: return 0x80;  // light_active: percent of full scale
    case 6: return 0x80;  // light_inactive: percent of full scale
    case 7: return 0x80;  // sound dB: percent of full scale
    case 8: return 0x80;  // sound dBAudible: percent of full scale
    default: return 0x00; // raw mode
    }
  }

  var addEventToElements=function(eventType, selector, listener) {
    var elems=document.querySelectorAll(selector);
    
    for (var i=0; i<elems.length; i++) {
      (function() {
        var c=i;
        elems[i].addEventListener(eventType, function(e) {
          listener.apply(this, [e, c]);
        });
      })();
    }
  };


  var setMotorSpeed=function(motor, speed) {
    var cmd=[0x0c, 0x00, 0x80, 0x04, motor, speed, 0x07, 0x01, 0x00, 0x20, 0x00, 0x00, 0x00, 0x00];
    log("writing "+cmd);
    writeSerial(cmd);
    //setTimeout(function() {notifySensor("servo", motor, speed, speed)}, 200);
    notifySensor("servo", motor, speed, speed);
  }

  var forward=function() {
    setMotorSpeed(0, 100);
    setMotorSpeed(1, 100);
  }

  var stop=function() {
    setMotorSpeed(0, 0);
    setMotorSpeed(1, 0);
  }

  var setInputPort=function(port, inputType, inputMode) {
    var cmd=[0x05, 0x00, 0x00, 0x05, port, inputType, inputMode];
    writeSerial(cmd);
  }

  var readServo=function(port) {
    var cmd=[0x03, 0x00, 0x00, 0x06, port];
    writeSerial(cmd);
  }

  var readSensor=function(port) {
    var cmd=[0x03, 0x00, 0x00, 0x07, port];
    writeSerial(cmd);
  }

  var flipState=function(deviceLocated) {
    btnClose.disabled=deviceLocated;
  }
  
  //var serialPort='/dev/tty.bluetooth-Jamie';
  //var serialPort='/dev/tty.bluetooth-Bailey';
  var openSerial=function(serialPort, callback) {
    var _callback = function(cInfo) {
      flushStaleInput(cInfo, function() {
        onOpen(cInfo);
        callback();
      }, Date.now());
    };
    if (!serialPort) {
      logError("Invalid serialPort");
      return;
    }
    flipState(true);
    log("Connecting to "+serialPort);
    serial_lib.openSerial(serialPort, _callback);
  }
  
  var flushStaleInput=function(cInfo, callback, startTime) {
    if (Date.now()-startTime>1000) {  // reads everything for 1s, to avoid stale data on robot
      callback();
      return;
    }
    chrome.serial.read(cInfo.connectionId, 24, function() {
      flushStaleInput(cInfo, callback, startTime);
    });
    
  }

  var onOpen=function(cInfo) {
      logSuccess("Device found (connectionId="+cInfo.connectionId+")");
      flipState(false);
      statusLine.textContent="Connected";
      log("started listener");
      serial_lib.startListening(function(data) {
        onSensorRawData(data);
      });
  };

  var notifySensor=function(sensor, port, value1, value2, rawData) {
    //console.log("got "+sensor+" "+port+": v1="+value1+" v2="+value2);
    if (sensorListeners[sensor]) {
console.log("sensor "+sensor+" value1="+value1+" data="+rawData);
      sensorListeners[sensor].callback.apply(sensorListeners[sensor].context, [port, value1, value2]);
    }
  }

  var onSensorRawData=function(data) {
    switch (data[1]) {
    // setInputMode
    case 0x05: 
      break;

    // getOutputState
    case 0x06: 
      var portId=data[3];
      var rotationCount=(data[16]<<24)+(data[15]<<16)+(data[14]<<8)+data[13];
      var speed=data[7];
      notifySensor("servo", portId, rotationCount, speed, data);
      break;

    // getInputValues
    case 0x07:
      var portId=data[3];
      switch (data[6]) {
        case 0x01: notifySensor("switch", portId, data[12]===1); break;
        case 0x03: notifySensor("light", portId, data[13]*256+data[12], null, data); break;
        case 0x07: notifySensor("sound", portId, data[13]*256+data[12], null, data); break;
        default: console.log("unknown sensor type: "+data[6]);
      }
      break;
    }
  }
  
  var writeSerial=function(bytes) {
    if (!serial_lib.isConnected()) {
      logError("Not connected");
      return;
    }
    if (!bytes || bytes.length==0) {
      logError("Nothing to write");
      return;
    }
    serial_lib.writeBytesSerial(bytes); 
  }
  
  var onRead=function(readData) {
    log("read: "+readData);
  }
  
  var closeSerial=function() {
   stopSensorReader();
   serial_lib.closeSerial(onClose);
  }
  
  var onClose = function(result) {
   flipState(true);
  }
  
  
  return {
    "init": init,
    "setServoSpeed": setMotorSpeed,
    "onSensor": onSensor,
    "connect" : openSerial
  }
})();

Robot.init();

