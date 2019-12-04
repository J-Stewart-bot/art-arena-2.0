const express = require("express");
const http = require("http");
const app = express();

const server = http.createServer(app);

// var io = require("socket.io").listen(server);
const io = require("socket.io")(server, {
  // below are engine.IO options
  pingTimeout: 30000,
  pingInterval: 30000
});

app.use(express.static("public"));
app.set("view engine", "ejs");
// app.listen(8080);
server.listen(process.env.PORT || 8080, () => {
  console.log("Server listening on Port 8080");
});

// Random Cartoon
// https://robohash.org/khjasfghjgdflkjb.png?set=set2

const randomImage = function() {
  const defaultWidth = 500;
  const defaultHeight = 300;
  const randomNumber = Math.floor(Math.random() * 1048);
  console.log(
    "Random Image",
    `https://picsum.photos/id/${randomNumber}/${defaultWidth}/${defaultHeight}`
  );

  return `https://picsum.photos/id/${randomNumber}/${defaultWidth}/${defaultHeight}`;
};

const determineWinner = function(winners) {
  let winningValue = 0;
  let secondPlace = 0;
  let winningPicture = null;
  let secondPicture = null;

  for (const winner of Object.keys(winners)) {
    if (winner !== "total") {
      if (winners[winner] > winningValue) {
        secondPlace = winningValue;
        secondPicture = winningPicture;
        winningValue = winners[winner];
        winningPicture = winner;
      } else if (winners[winner] > secondPlace) {
        secondPlace = winners[winner];
        secondPicture = winner;
      }
    }
  }
  if (winningValue === secondPlace) {
    if (winningValue === 1) {
      console.log("we have a four way tie");
      return null;
    } else {
      console.log("we have a tie");
      return null;
    }
  } else {
    return winningPicture;
  }
};

// routing
// index page
app.get("/", function(req, res) {
  res.render("pages/index");
});

// about page
app.get("/about", function(req, res) {
  res.render("pages/about");
});

// app.get("/", function(req, res) {
//   res.sendFile(__dirname + "/index.html");
// });

// usernames which are currently connected to the chat
const usernames = {};

// rooms which are currently available in chat
const rooms = ["Lobby", "Arena #1", "Arena #2"];
const roomSpotsTaken = { Lobby: 0, "Arena #1": 0, "Arena #2": 0 };
const roomImages = {};
const roomVotes = {};

// random image
let img = randomImage();

io.sockets.on("connection", function(socket) {
  // when the client emits 'adduser', this listens and executes
  socket.on("adduser", function(username) {
    // store the username in the socket session for this client
    let key = username.uid;
    let value = username.displayName;
    socket.username = [key, value];
    // store the room name in the socket session for this client
    socket.room = "Lobby";
    // add the client's username to the global list
    usernames[key] = value;
    // send client to room 1
    socket.join("Lobby");
    roomSpotsTaken["Lobby"] += 1;
    // echo to client they've connected
    socket.emit("updatechat", "SERVER", "You have connected to Lobby");
    // echo to room 1 that a person has connected to their room
    socket.broadcast
      .to("Lobby")
      .emit("updatechat", "SERVER", value + " has connected to this room");
    socket.emit("updaterooms", rooms, "Lobby");
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on("sendchat", function(data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit("updatechat", socket.username[1], data);
  });

  socket.on("switchRoom", function(newroom) {
    // leave the current room (stored in session)
    let room = io.sockets.adapter.rooms[newroom];
    if (room === undefined && newroom !== "Lobby") {
      let stockImage = randomImage();
      roomImages[newroom] = { reference: stockImage };
      roomVotes[newroom] = { total: 0 };
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);
      // join new room, received as function parameter
      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.emit("updatechat", "SERVER", "You have connected to " + newroom);
      // sent message to OLD room
      socket.broadcast
        .to(socket.room)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has left this room"
        );
      // update socket session room title
      socket.room = newroom;
      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);
    } else if (newroom !== "Lobby" && room.length < 4) {
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);
      // join new room, received as function parameter
      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      // check how many people are in the room after a person joins
      room = io.sockets.adapter.rooms[newroom];
      if (room.length === 4) {
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      }

      socket.emit("updatechat", "SERVER", "You have connected to " + newroom);
      // sent message to OLD room
      socket.broadcast
        .to(socket.room)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has left this room"
        );
      // update socket session room title
      socket.room = newroom;
      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);
    } else if (newroom === "Lobby") {
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);
      // join new room, received as function parameter
      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.emit("updatechat", "SERVER", "You have connected to " + newroom);
      // sent message to OLD room
      socket.broadcast
        .to(socket.room)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has left this room"
        );
      // update socket session room title
      socket.room = newroom;
      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);
    } else {
      console.log("FULL ROOM");
    }
    console.log(roomSpotsTaken);
    io.emit("updatespots", roomSpotsTaken);
  });

  socket.on("donedrawing", function(drawing) {
    roomImages[socket.room][socket.username[0]] = drawing;
    socket.broadcast
      .to(socket.room)
      .emit(
        "updatechat",
        "SERVER",
        socket.username[1] + " has completed their painting"
      );
    if (Object.keys(roomImages[socket.room]).length === 5) {
      for (const user of Object.keys(roomImages[socket.room])) {
        if (user !== "reference") {
          roomVotes[socket.room][roomImages[socket.room][user]] = 0;
        }
      }
      io.in(socket.room).emit("displayphotos", roomImages[socket.room]);
    }
  });

  socket.on("submitvote", function(key) {
    roomVotes[socket.room].total += 1;
    roomVotes[socket.room][key] += 1;
    if (roomVotes[socket.room].total === 4) {
      io.in(socket.room).emit(
        "displaywinner",
        determineWinner(roomVotes[socket.room])
      );
    }
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function() {
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit("updateusers", usernames);
    // echo globally that this client has left
    socket.broadcast.emit(
      "updatechat",
      "SERVER",
      socket.username[1] + " has disconnected"
    );
    socket.leave(socket.room);
  });
});
