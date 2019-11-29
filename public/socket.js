var socket = io.connect("http://localhost:8080");

// on connection to server, ask for user's name with an anonymous callback
socket.on("connect", function() {
  // call the server-side function 'adduser' and send one parameter (value of prompt)
  socket.emit("adduser", prompt("What's your name?"));
});

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on("updatechat", function(username, data) {
  $("#conversation").append("<b>" + username + ":</b> " + data + "<br>");
});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on("updaterooms", function(rooms, current_room) {
  $("#rooms").empty();
  $.each(rooms, function(key, value) {
    if (value == current_room) {
      $("#rooms").append("<div>" + value + "</div>");
    } else {
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
    if (image !== "newroom") {
      $(`#spot${i}`).attr("src", images[image]);
      i++;
    }
  }
});

socket.on("displayreference", function(images) {
  $("#mainImage").attr("src", images.reference);
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
  });

  // when the client clicks submit
  $("#drawing-complete").click(function() {
    //when the client clicks SUBMIT
    $(this).attr("disabled", "disabled");
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
});
