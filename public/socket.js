var socket = io.connect();

// on connection to server, ask for user's name with an anonymous callback
socket.on("connect", function() {
  // call the server-side function 'adduser' and send one parameter (value of prompt)
  // socket.emit("adduser", "Guest");
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on("updatechat", function(username, data) {
  const randNum = Math.round(Math.random() * 1000000).toString();
  $(".alerts").prepend(
    `<div role="alert" aria-live="polite" aria-atomic="true" class="toast-${randNum} toast" data-delay="10000">
    <div id="th" class="toast-header">
    <i class="fad fa-paint-brush-alt"></i>    
      <strong class="mr-auto">` +
      username +
      `</strong>
      <small>Just Now</small>
      <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div id="tb" class="toast-body">` +
      data +
      `</div>
  </div>`
  );
  $(`.toast-${randNum}`)
    .toast("show")
    .on("hidden.bs.toast", function() {
      $(`.toast-${randNum}`).remove();
    });
});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on("updaterooms", function(rooms, current_room) {
  $(".toast").toast("show");
  $("#rooms").empty();
  $.each(rooms, function(key, value) {
    if (value == current_room) {
      $(".toast").toast("show");
      // $("#rooms").append("<div>" + value + "</div>");
      //console.log(current_room)
    } else {
      $(".toast").toast("show");
      // $("#rooms").append(
      //   '<div><a onclick="switchRoom(\'' + value + "')\">" + value + "</a></div>"
      // );
    }
  });
  $("#currentRoom").empty();
  $("#currentRoom").append(`<h3>You are currently in ${current_room} </h3>`);
});

socket.on("updatespots", function(roomSpotsTaken) {
  console.log(roomSpotsTaken["Arena #1"]);
  $("#a1Spots").text(`${4 - roomSpotsTaken["Arena #1"]} spots left`);
  $("#a2Spots").text(`${4 - roomSpotsTaken["Arena #2"]} spots left`);
});

socket.on("displayphotos", function(images) {
  $(".paintings").css("display", "flex");
  let i = 1;
  for (const image of Object.keys(images)) {
    if (image !== "reference") {
      $(`#spot${i}`).attr("src", images[image]);
      i++;
    }
  }
});

socket.on("displayreference", function(images) {
  $(".waitingText").css("display", "none");
  $(".playingText").css("display", "flex");
  $(".submitButton").css("display", "flex");
  $("#mainImage").attr("src", images.reference);
  $(".btn").css("visibility", "visible");
});

socket.on("displaywinner", function(image) {
  if (image !== null) {
    $("#mainImage").attr("src", image);
  } else {
    $("#mainImage").attr("src", image);
  }
});

function switchRoom(room) {
  socket.emit("switchRoom", room);
}

// on load of page
$(function() {
  // when the client clicks SEND
  $("#datasend").click(function() {
    var message = $("#data").val();
    $("#data").val("");
    // tell server to execute 'sendchat' and send along one parameter
    socket.emit("sendchat", message);
    // .toast("show");
  });

  // when the client clicks submit
  $("#drawing-complete").click(function() {
    //when the client clicks SUBMIT
    $(this).css("display", "none");
    $(".paintings");
    var canvas = document.getElementById("my-canvas");
    var dataURL = canvas.toDataURL();
    // tell server to execute 'donedrawing' and send along one parameter
    socket.emit("donedrawing", dataURL);
  });

  // when the client hits ENTER on their keyboard
  $("#data").keypress(function(e) {
    if (e.which == 13) {
      $(this).blur();
      $("#datasend")
        .focus()
        .click();
    }
  });

  $("#vote1").click(function() {
    $(this).attr("disabled", "disabled");
    $("#vote2").attr("disabled", "disabled");
    $("#vote3").attr("disabled", "disabled");
    $("#vote4").attr("disabled", "disabled");
    let voteFor = document.getElementById("spot1").src;
    socket.emit("submitvote", voteFor);
  });
  $("#vote2").click(function() {
    $(this).attr("disabled", "disabled");
    $("#vote1").attr("disabled", "disabled");
    $("#vote3").attr("disabled", "disabled");
    $("#vote4").attr("disabled", "disabled");
    let voteFor = document.getElementById("spot2").src;
    socket.emit("submitvote", voteFor);
  });
  $("#vote3").click(function() {
    $(this).attr("disabled", "disabled");
    $("#vote2").attr("disabled", "disabled");
    $("#vote1").attr("disabled", "disabled");
    $("#vote4").attr("disabled", "disabled");
    let voteFor = document.getElementById("spot3").src;
    socket.emit("submitvote", voteFor);
  });
  $("#vote4").click(function() {
    $(this).attr("disabled", "disabled");
    $("#vote2").attr("disabled", "disabled");
    $("#vote3").attr("disabled", "disabled");
    $("#vote1").attr("disabled", "disabled");
    let voteFor = document.getElementById("spot4").src;
    socket.emit("submitvote", voteFor);
  });
});
