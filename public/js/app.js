var cars = [];
var hostcar;
var keyboardcar;
var ctx;
var oscillator;
var sine;
var vol;
var frameAdjuster;
var ghostData = [];
var ghostFrameIndex = 0;
var ghostPlayData = [];
var recordGhost = false;
var trackEl;

var race = {
  mode : "warmup",
  totallaps: 2,
  currentlap: 0,
  laptime : 0,
  fastestlap: {
    player : "jim",
    time: 1000000000000000000
  },
  winner : 0,
  slowestlap : {
    player : "bob",
    time: 0
  },
  prepareTrack: function(track){

    setTimeout(function(){
      prepareTrack(track);
    },500);
  },
  startPositions : [],
  welcome : function(details){
    this.mode = details.mode;
    this.currentlap = details.currentlap;
    this.totallaps = details.totallaps;
    this.updateUI();
  },
  updateUI: function(){
    if(this.mode == "racing"){
      $(".laps .message").hide();
      $(".lap-info").show();
      $(".lap-info .lap-count").text(this.currentlap);
      $(".lap-info .total-laps").text(this.totallaps);
    }
  },
  startWarmup : function(){

    showMessage("warmup");
    this.mode = "warmup";

    setTimeout(function(that){ return function(){
        for(var c in cars) {
          var car = cars[c];
          car.angle = 270;
          var random = Math.floor(Math.random() * that.startPositions.length);
          car.x = that.startPositions[random].x + 2;
          car.y = that.startPositions[random].y;
          car.showx = car.x * scaling;
          car.showy = car.y * scaling;
        }
      }
    }(this),1000);

    $(".laps .lap-info").hide();

    setTimeout(function(){
      $(".laps .message").show().text("Warm up");
    },500);


    for(var c in cars) {
      var car = cars[c];
      car.speed = 0;
    }

  },
  startCountdown : function(){

    showMessage("race time!");

    //how long does a modeswitch take???? 3000....

    this.mode = "countdown";

    setTimeout(function(that){ return function(){
        for(var c in cars) {
          var car = cars[c];
          car.mode = "frozen";
          car.angle = 270;
          var random = Math.floor(Math.random() * that.startPositions.length);
          car.x = that.startPositions[random].x + 2;
          car.y = that.startPositions[random].y;
          car.showx = car.x * scaling;
          car.showy = car.y * scaling;
        }
      }
    }(this),1000);

    $(".laps .lap-info").hide();

    $(".laps .message").text("").show();
    setTimeout(function(){  $(".laps .message").text("READY");    },3000);
    setTimeout(function(){  $(".laps .message").text("SET");    },4000);
    setTimeout(function(){  $(".laps .message").text("GO!!!");    },5000);

  },

  updateLap : function(lap){
    console.log("updateLap",lap);

    this.currentlap = lap;

    if(this.mode == "racing") {
      if(this.currentlap == this.totallaps) {
        $(".lap-info").hide();
        $(".laps .message").show().text("Final Lap!!");
      } else {
        $(".lap-info").show();
        $(".laps .lap-count").text(this.currentlap);
        $(".laps .total-laps").text(this.totallaps);
      }

    }
  },
  startRace: function(laps){



    setTimeout(function(){
      $(".laps .message").hide();
      $(".laps .lap-info").show();
    },1000);

    //Rest all car lap counts
    for(var c in cars){
      var car = cars[c];
      car.laps = 0;
      car.mode = "normal";
    }

    this.totallaps = laps;
    this.currentlap = 0;
    this.mode = "racing";

    $(".laps .lap-count").text(this.currentlap);
    $(".laps .total-laps").text(this.totallaps);


  },
  finishLap : function(car){

    ghostData = [];
    ghostFrameIndex = 0;

  },
  finishRace : function(winner){

    this.mode = "over";
    $(".laps .lap-info").hide();
    $(".laps .message").text(winner + " WINS!");
  }
}

var sockjs_url = '/echo';
var sockjs = new SockJS(sockjs_url);

var carcolors = ["#A15417",
"#D832E3",
"#4E80C7",
"#F86395",
"#676D1E",
"#E20747",
"#B136A2",
"#EF8D30",
"#8F41BF",
"#A8AFFC",
"#6B60AC",
"#7E802D"]

var carcolors = ["#FFFFFF"];

var laps = 0;
var scaling = 15;


var canvasTrack, context, trackHeight, trackWidth;

var hexes = {
  "#000000" : "road",
  "#5a5a5a" : "road",
  "#8fcf4b" : "grass",
  "#f1aa22" : "turbo",
  "#b97d37" : "windmill",
  "#2194ca" : "water",
  "#6ba52d" : "tree",
  "#ffffff" : "finish",
  "#a9a9a9" : "ledge",
  "#373737" : "overpass",
  "#7dba3d" : "lamp",
  "#d4c921" : "jump"
}

function getCar(id){
  var foundcar;
  for(var c in cars){
    var car = cars[c];
    if(car.id == id){
      foundcar = car;
    }
  }
  return foundcar;
}

var chatting = false;


function sendChat(message){

  var car = getCar(myid);

  var update = {
    "driver" : car.driver,
    "type" : "chat",
    "text": message
  }
  sockjs.send(JSON.stringify(update));

  addChat(car.driver,message);
}


// When a car finishes a lap
function finishLap(car){

  console.log("Finished " + car.laps);

  var update = {
    "type" : "finishlap",
    "laps" : car.laps,
    "driver" : car.driver
  }
  sockjs.send(JSON.stringify(update));
  trackAnimation();
}


$(document).ready(function(){

  audioStuff();

  $(window).on("keypress", function(e){

    if(e.keyCode == 114){
      // race.startRace(5);
    }

    if(e.keyCode == 99){
      // race.startCountdown();
    }

    if(e.keyCode == 119){
      // race.startWarmup();
    }

    if(e.keyCode == 13) {
      if(chatting == false){
        $(".chat-input").show().focus();
        $(".chat-input-wrapper .instructions").hide();
        chatting = true;
      } else if (chatting == true){
        var message = $(".chat-input").val();
        if(message.length > 0){
          sendChat(message);
        }
        $(".chat-input").val("").blur().hide();
        chatting = false;
        $(".chat-input-wrapper .instructions").show();
      }
    }
  });


  $(".driver-name").on("click", function(e){
    $(this).select();
  });

  $(".driver-name").on("keyup", function(e){
    var newName = $(this).val();
    var car = getCar(myid);
    car.changeDriver(newName);
    if(e.keyCode == 13) {
      $(this).blur();
    }
  });



  $(window).on("keydown",function(e){

    if(e.keyCode == 37) {
      keyboardcar.setDirection("steering","left-on");
    }
    if(e.keyCode == 39) {
      keyboardcar.setDirection("steering","right-on");
    }
    if(e.keyCode == 38) {
      keyboardcar.setDirection("gas","on");
    }
  });


  $(window).on("keyup",function(e){
    if(e.keyCode == 37) {
      keyboardcar.setDirection("steering","left-off");
    }
    if(e.keyCode == 39) {
      keyboardcar.setDirection("steering","right-off");
    }
    if(e.keyCode == 38) {
      keyboardcar.setDirection("gas","off");
    }
  });

  gameLoop();

});

var time;
var delta;
var elapsedTime = 0;
var tick = 0;

function gameLoop() {

  var now = new Date().getTime();
  delta = now - (time || now);
  time = now;

  var xtotal = 0; //what is this
  var ytotal = 0; // what is this

  for(var i = 0; i < cars.length; i++){

    var car = cars[i];
    driveCar(car);

    // race.laptime = race.laptime + delta; //update the race lap timer
    car.laptime = car.laptime + delta; // update the car lap timer

    xtotal = xtotal + car.x;
    ytotal = ytotal + car.y;

    $(".lap-time").text(formatTime(elapsedTime));

  }

  var xavg = xtotal / cars.length || 0;
  var yavg = ytotal / cars.length || 0;

  var xdeg = 5 * (-1 + (2 * xavg / trackWidth));
  var ydeg = 45 + 5 * (1 - (2 * yavg / trackHeight));


  $(".track").css("transform","rotateX(" +ydeg+"deg) rotateY("+xdeg+"deg)");

  window.requestAnimationFrame(gameLoop);
}

function formatTime(total){
  var ms = Math.floor(total / 10 % 100);
  if(ms < 10){
    ms = "0" + ms;
  }
  var sec = Math.floor(total / 1000 % 60);

  return sec + "." + ms;
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

function driveCar(car) {

  car.x = Math.round(car.showx / scaling);
  car.y = Math.round(car.showy / scaling);

  car.currentx = car.x;
  car.currenty = car.y;

  var currentPosition = checkPosition(car.x,car.y) || "grass"; //What it's currently sitting on

  if(currentPosition == "turbo") {
    car.speed = car.speed + 4;
  }

  if(car.speed > 10){
    car.speed = 10;
  }

  var xd = 0;
  var yd = 0;

  var speedchange = car.acceleration;

  frameAdjuster = 16.67 / delta;

  speedchange = speedchange * frameAdjuster;

  if(car.gas == "on" && car.speed < car.maxspeed) {
    car.speed = car.speed + speedchange;
  } else if (car.mode == "jumping") {

  } else {
    car.speed = car.speed - speedchange;
  }

  if(car.speed > car.maxspeed) {
    car.speed = car.speed - speedchange;
  }

  if(car.speed < 0){
    car.speed = 0;
  }

  var turnspeed = car.maxspeed - 1; //rate at which the wheel turns

  // var turnspeed = 4; // moon


  var turning = true;

  if(car.mode == "jumping" || car.mode == "frozen") {
    turning = false;
  }

  if(currentPosition == "water"){
    turnspeed = turnspeed / 3;
  }

  var turnchange = car.turnacceleration * frameAdjuster;
  var turnchange = car.turnacceleration;

  if((car.direction == "right" || car.direction == "left") && turning){

    if(car.direction == "left") {
      car.turnvelocity = car.turnvelocity - turnchange;

      if(Math.abs(car.turnvelocity) > turnspeed){
        car.turnvelocity = -1 * turnspeed;
      }

    }

    if(car.direction == "right") {
      car.turnvelocity = car.turnvelocity + turnchange;

      if(car.turnvelocity > Math.abs(turnspeed)){
        car.turnvelocity = turnspeed;
      }
    }

    if(car.angle > 360) {
      car.angle = car.angle - 360;
    }

    if(car.angle < 0){
      car.angle = car.angle + 360;
    }

  } else if (car.direction == "none") {
    if(car.turnvelocity > 0) {
      car.turnvelocity = car.turnvelocity - turnchange;
    }
    if(car.turnvelocity < 0 ){
      car.turnvelocity = car.turnvelocity + turnchange;
    }
  } else if (Math.abs(car.wheelturn) > 0) {

    car.turnvelocity = car.turnvelocity + turnchange;
    turnspeed = turnspeed * car.wheelturn;
    if(car.turnvelocity > turnspeed){
      car.turnvelocity = turnspeed;
    }

  } else if (car.wheelturn == 0) {

    if(car.turnvelocity > 0) {
      car.turnvelocity = car.turnvelocity - turnchange;
    }
    if(car.turnvelocity < 0 ){
      car.turnvelocity = car.turnvelocity + turnchange;
    }

  }

  car.angle = car.angle + car.turnvelocity;

  var adjacent = Math.cos(toRadians(car.angle)) * car.speed;
  var opposite = Math.sin(toRadians(car.angle)) * car.speed;
  var xd = opposite;
  var yd = -1 * adjacent;

  car.nextx = Math.round((car.showx + xd) / scaling);
  car.nexty = Math.round((car.showy + yd) / scaling);

  var nextPosition = checkPosition(car.nextx,car.nexty);

  if(car.currentx != car.nextx || car.currenty != car.nexty){
    if(nextPosition == "tree"){
    }
  }

  // Leave a skid mark on the track
  // If it's on the road - then depends on speed and turning radius
  // If it's not, then just rip it up a bit

  var turnpercent = Math.abs(car.turnvelocity) / 4;
  var speedpercent = car.speed / car.maxspeed;

  if(car.currentx != car.nextx || car.currenty != car.nexty){

    var averagepercent = (speedpercent + turnpercent) / 2 * 100;
    var jam  = -75 + averagepercent;
    var opacity = jam/25 * .1;

    if(currentPosition == "road") {
      ctx.fillStyle = "rgba(0,0,0,"+opacity+")";
      ctx.fillRect(car.currentx * scaling, car.currenty * scaling, scaling, scaling);
    } else {
      ctx.fillStyle = "rgba(0,0,0,.05)";
      ctx.fillRect(car.currentx * scaling, car.currenty * scaling, scaling, scaling);
    }
  }

  //Controls the Skidding volume oscillator, which is always on
  if(turnpercent == 1 && speedpercent > .5) {
    vol.gain.value = .012 * turnpercent || 0;
  } else {
    vol.gain.value = 0;
  }

  // Trail shit
  var adjacent = Math.cos(toRadians(car.angle + 180)) * car.speed;
  var opposite = Math.sin(toRadians(car.angle - 180)) * car.speed;
  var xxd = opposite;
  var yyd = -1 * adjacent;

  // Particles, need a starting spot
  // And a destination spot
  // A timeout
  var leavetrails = false;

  //always leave a trail
  if((car.currentx != car.nextx || car.currenty != car.nexty) && leavetrails){
    var trail = $("<div class='spark'></div>");
    trail.height(scaling / 1).width(scaling / 1);
    trail.css("left",car.showx).css("top",car.showy);
    $(".track").append(trail);

    setTimeout(function(el,x,y) { return function() {
      el.css("transform","translateY("+ y * 20 +"px) translateX("+x * 20 +"px) scale(0)");
     }; }(trail,xxd,yyd), 1);

    setTimeout(function(el) { return function() { el.remove(); }; }(trail), 500);
  }

  //collisions

  if(car.currentx != car.nextx || car.currenty != car.nexty){
    for(var c in cars){
      var othercar = cars[c];
      if(othercar.id != car.id){
        if(othercar.nextx == car.nextx && othercar.nexty == car.nexty){
          // collideCars(car,othercar);
        }
      }
    }
  }

  var move = true;

  if(car.mode == "frozen"){
    move = false;
  }

  $(".place").css("left",car.x * scaling).css("top",car.y * scaling);

  if(currentPosition == "grass" && car.mode != "jumping"){
    if(car.speed > 1){
      car.speed = 1;
    }
  }

  if(car.mode == "normal") {
    if(currentPosition == "overpass" && nextPosition == "ledge" ) {
      move = false;
    }
    if(currentPosition == "road" && nextPosition == "ledge" ) {
      car.mode = "under";
    }
  } else if (car.mode == "under") {
    if(currentPosition == "overpass" && nextPosition == "road"){
      move = false;
    }
    if(currentPosition == "ledge" && nextPosition == "road") {
      car.mode = "normal";
    }
    if(currentPosition == "ledge" && nextPosition == "grass") {
      move = false;
    }


  }
  //
  if(car.mode == "jumping") {
    move = true;
  }

  if(move){
    car.showx = car.showx + xd;
    car.showy = car.showy + yd;
  } else {
    car.speed = 1;
  }

  var maxfq = 800;
  var minfq = 400;

  if(car.mode == "jumping"){
    maxfq = 0;
  }

  var frequency = minfq + ((car.speed/car.maxspeed) * (maxfq - minfq));

  enginesine.frequency.value = frequency / 10;
  engine.frequency.value = frequency;

  car.el.attr("mode",car.mode);

  if(currentPosition == "finish" && car.angle > 180 && car.angle < 360){
    if(car.currentx != car.nextx) {

      // race.finishLap(car);

      car.laps++;
      finishLap(car);

      if(car.laptime < car.bestlap || car.bestlap == 0) {
        car.bestlap = car.laptime;
      }

      car.laptime = 0;

    }
  }

  if(car.mode == "normal" && currentPosition == "jump" && car.speed > 1) {
    car.jumpElapsed = 0;
    car.jumpTotal = car.speed * scaling / 2.5 ;//jump distance relative to speed
    car.mode = "jumping";
  }

  var jumpHeight = 0;

  if(car.mode == "jumping") {

    var maxHeight = car.jumpTotal / scaling;
    //moon
    // var maxHeight = car.jumpTotal / scaling * 10;

    if(car.jumpElapsed < car.jumpTotal /2) {
      jumpHeight = easeOutCubic(car.jumpElapsed + 1 , 0, maxHeight , car.jumpTotal/2);
    } else {
      jumpHeight = easeInCubic(car.jumpElapsed - car.jumpTotal/2, maxHeight, -1 * maxHeight, car.jumpTotal/2);
    }

    jumpHeight = jumpHeight * 15;
    car.jumpElapsed++; //moon
    // car.jumpElapsed = car.jumpElapsed + .2;//moon

    if(car.jumpElapsed >= car.jumpTotal){
      car.mode = "normal";
    }

  }

  // use toFixed for the longer values to reduce decimal points

  var update = {
    "type" : "update",
    "x": car.showx,
    "y": car.showy,
    "gas" : car.gas,
    "driver" : car.driver,
    "rotation" : car.angle,
    "height" : jumpHeight,
    "velocity" : car.speed,
    "turnvelocity" : car.turnvelocity
  }

  try {
    sockjs.send(JSON.stringify(update));
  } catch(err) {

  }

  if(jumpHeight > 0){
    if(car.currentx != car.nextx || car.currenty != car.nexty){
      var trail = $("<div class='trail'><div class='shadow'></div></div>");
      trail.height(scaling).width(scaling);

      trail.css("left",car.x * scaling).css("top",car.y * scaling);
      trail.css("transform","translateZ("+ jumpHeight +"px)");
      trail.find(".shadow").css("transform","translateZ("+ -1 * jumpHeight +"px)");
      $(".track").prepend(trail);
      setTimeout(function(el) { return function() { el.remove(); }; }(trail), 400);
    }
  }

  // moves the car holder
  car.el.css("transform", "translateY("+car.showy+"px) translateX("+car.showx+"px)");

  //makes the body jump

  if(currentPosition == "overpass" && car.mode == "normal") {
    car.body.css("transform", "scale(1.1) rotateZ("+car.angle+"deg) translateZ("+jumpHeight+"px");
  } else {
    car.body.css("transform", " rotateZ("+car.angle+"deg) translateZ("+jumpHeight+"px");
  }
  car.shadow.css("transform", "rotateZ("+car.angle+"deg)");

    ghostData.push({
      "time" : race.laptime,
      "x" : car.showx,
      "y" : car.showy
    })

    for(var i = ghostFrameIndex; i < ghostPlayData.length; i++){
      var frame = ghostPlayData[i];
      if(frame.time >= race.laptime){
        var thisFrame = frame;
        ghostFrameIndex = i;
        break;
      }
    }

    if(thisFrame){
      $(".ghost").css("left", thisFrame.x).css("top", thisFrame.y);
    }

  if(othercars){
    updateGhostCars();
  }

}

//This checks the playerStates and updates the cars accordingly....
// Except - we need to drive this shit, not just 'update it'


var xdelta;
var lastrotation = 0;
var ydelta;

function updateGhostCars(){

  for(var k in othercars){
    var thisState = playerStates[k];

      var c = othercars[k];

      //If there is some new info, that we haven't seen yet.....
      if(thisState){

        c.x =             thisState.x;
        c.y =             thisState.y;
        c.turnvelocity =  thisState.turnvelocity;
        c.driver =        thisState.driver;
        c.velocity =      thisState.velocity;
        c.rotation =      thisState.rotation;
        c.gas =           thisState.gas;
        c.height =        thisState.height || 0;

        delete playerStates[k];

      }

      tick++;

      // BUT IN THE MEANTIME IF WE DONT HAVE NEW DATA
      // so lets calcualte it

      c.rotation = parseInt(c.rotation) + parseInt(c.turnvelocity);

      if(c.rotation > 360) {
        c.rotation = c.rotation - 360;
      }

      if(c.rotation < 0){
        c.rotation = c.rotation + 360;
      }

      if(c.gas == "on") {
        c.velocity = c.velocity + .06;
        if(c.velocity > 5) {
          c.velocity = 5;
        }
      }

      if(c.gas == "off") {
        c.velocity = c.velocity - .06;
        if(c.velocity < 0){
          c.velocity = 0;
        }
      }

      var opposite = Math.sin(toRadians(c.rotation)) * c.velocity;
      var adjacent = Math.cos(toRadians(c.rotation)) * c.velocity;

      var xd = opposite;
      var yd = -1 * adjacent;

      c.x = parseFloat(c.x) + xd;
      c.y = parseFloat(c.y) + yd;


      if(c.height > 0){
        c.shadow.show();
      } else {
        c.shadow.hide();
      }

      c.el.find(".name").text(c.driver);
      c.el.find(".body").css("transform","rotateZ("+c.rotation+"deg");
      c.shadow.css("transform","translateZ("+ -1 * c.height+"px)");
      c.el.css("transform","translateX("+ c.x +"px) translateY("+c.y+"px) translateZ("+c.height+"px)");
  }
}

function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
	return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
}

function easeInCubic(currentIteration, startValue, changeInValue, totalIterations) {
	return changeInValue * Math.pow(currentIteration / totalIterations, 3) + startValue;
}

function checkPosition(x,y){
  var p = context.getImageData(x, y, 1, 1).data;
  var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
  // $("body").css("background",hex);
  return hexes[hex];
}

function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255)
    throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}


