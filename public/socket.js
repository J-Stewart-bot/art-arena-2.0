var socket = io.connect();

// on connection to server, ask for user's name with an anonymous callback
socket.on("connect", function() {
  // call the server-side function 'adduser' and send one parameter (value of prompt)
  socket.emit("adduser", prompt("What's your name?"));
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on("updatechat", function(username, data) {
  const randNum = Math.round(Math.random() * 1000000).toString();
  $(".alerts").prepend(
    '<div aria-live="polite" aria-atomic="true" >' +
      `<div class="toast-${randNum} toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="10000" >` +
      '<b class="toast-header">' +
      username +
      `:</b><div class="toast-${randNum} toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="10000" >` +
      data +
      '<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">' +
      '<span aria-hidden="true">&times;</span>' +
      "</button></div></div></div><br>"
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
      $("#rooms").append("<div>" + value + "</div>");
    } else {
      $(".toast").toast("show");
      $("#rooms").append(
        '<div><a href="#" onclick="switchRoom(\'' +
          value +
          "')\">" +
          value +
          "</a></div>"
      );
    }
  });
});

socket.on("displayphotos", function(images) {
  let i = 1;
  for (const image of Object.keys(images)) {
    if (image !== "reference") {
      $(`#spot${i}`).attr("src", images[image]);
      i++;
    }
  }
});

socket.on("displayreference", function(images) {
  $("#mainImage").attr("src", images.reference);
});

socket.on("displaywinner", function(image) {
  $("#mainImage").attr("src", image);
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
    $("#toRemove").css("visibility", "hidden");
    $(this).attr("disabled", "disabled");
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
