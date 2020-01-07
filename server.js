const express = require("express");
const http = require("http");
const app = express();

const server = http.createServer(app);

// var io = require("socket.io").listen(server);
const io = require("socket.io")(server, {
  // below are engine.IO options
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static("public"));
app.set("view engine", "ejs");
server.listen(process.env.PORT || 8080, () => {
  console.log("Server listening on Port 8080");
});

// Random Cartoon
// https://robohash.org/khjasfghjgdflkjb.png?set=set2
const randomCartoon = () => {
  const randomNum = Math.floor(Math.random() * 10000000);
  const setNum = Math.ceil(Math.random() * 5);
  return `https://robohash.org/${randomNum}.png?set=set${setNum}`;
};

const randomImage = function() {
  const randomNumber = Math.ceil(Math.random() * 85);
  return `https://picsum.photos/id/${randomNumber}/500/300`;
};

// Random Random
const randomRandom = () => {
  const randomNumber = Math.ceil(Math.random() * 2);
  if (randomNumber === 1) {
    return randomCartoon();
  } else {
    return randomImage();
  }
};

const determineWinner = function(winners) {
  let winningValue = 0;
  let secondPlace = 0;
  let winningPicture = null;

  for (const winner of Object.keys(winners)) {
    if (winner !== "total") {
      if (winners[winner] > winningValue) {
        secondPlace = winningValue;
        winningValue = winners[winner];
        winningPicture = winner;
      } else if (winners[winner] > secondPlace) {
        secondPlace = winners[winner];
      }
    }
  }
  return winningPicture;
  // if (winningValue === secondPlace) {
  //   if (winningValue === 1) {
  //     console.log("we have a four way tie");
  //     return null;
  //   } else {
  //     console.log("we have a tie");
  //     return null;
  //   }
  // } else {
  //   return winningPicture;
  // }
};

// routing
// index page
app.get("/", function(req, res) {
  res.render("pages/index");
});

// rooms which are currently available in chat
/*
const rooms = ["Lobby", "Arena #1", "Arena #2", "Arena #3", "Arena #4"];
const roomSpotsTaken = {
  Lobby: 0,
  "Arena #1": 0,
  "Arena #2": 0,
  "Arena #3": 0,
  "Arena #4": 0
};
*/
const roomImages = {};
const roomVotes = {};

let rooms = [
  {
    name: "Lobby",
    players: 0,
    maxPlayers: -1,
    images: {},
    votes: {}
  },
  {
    name: "Arena #1",
    players: 0,
    maxPlayers: 4,
    images: {},
    votes: {}
  },
  {
    name: "Arena #2",
    players: 0,
    maxPlayers: 4,
    images: {},
    votes: {}
  },
  {
    name: "Arena #3",
    players: 0,
    maxPlayers: 3,
    images: {},
    votes: {}
  },
  {
    name: "Arena #4",
    players: 0,
    maxPlayers: 2,
    images: {},
    votes: {}
  }
];

const roomSpotsTaken = () =>
  rooms.reduce((roomSpotsTaken, room) => {
    roomSpotsTaken[room.name] = room.players;
    return roomSpotsTaken;
  }, {});

io.sockets.on("connection", function(socket) {
  // when the client emits 'adduser', this listens and executes
  socket.on("adduser", function(username) {
    // store the username in the socket session for this client
    // store the room name in the socket session for this client
    // add the client's username to the global list
    // send client to room 1
    // echo to client they've connected
    // echo to room 1 that a person has connected to their room
    let key = username.uid;
    let value = username.displayName;
    socket.username = [key, value];

    socket.room = "Lobby";
    socket.join("Lobby");
    let room = rooms.find(room => room.name === "Lobby");
    room.players++;
    //roomSpotsTaken["Lobby"] += 1;

    socket.broadcast
      .to("Lobby")
      .emit("updatechat", "SERVER", value + " has connected to this room");
    socket.emit("updaterooms", rooms.map(room => room.name), "Lobby");
    io.emit("updatespots", roomSpotsTaken());
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on("sendchat", function(data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    if (!socket.username) {
      socket.emit("logout");
    }
    io.sockets.in(socket.room).emit("updatechat", socket.username[1], data);
  });

  socket.on("switchRoom", function(newroom) {
    console.log("You're in switch room");
    let previousRoom = rooms.find(room => room.name === socket.room);
    let nextRoom = rooms.find(room => room.name === newroom);
    // leave the current room (stored in session)
    if (!socket.username) {
      socket.emit("logout");
      return;
    } else if (newroom === "Lobby") {
      // // join new room, received as function parameter
      // // sent message to OLD room
      // // update socket session room title

      // socket.broadcast
      //   .to(socket.room)
      //   .emit(
      //     "updatechat",
      //     "SERVER",
      //     socket.username[1] + " has left this room"
      //   );
      // roomSpotsTaken[socket.room] -= 1;
      // socket.leave(socket.room);

      socket.join(newroom);
      socket.room = newroom;

      nextRoom.players++;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms.map(room => room.name), newroom);
    } else if (nextRoom.players < nextRoom.maxPlayers) {
      previousRoom.players--;
      socket.leave(socket.room);

      socket.join(newroom);
      nextRoom.players++;
      socket.room = newroom;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms.map(room => room.name), newroom);

      if (nextRoom.players === nextRoom.maxPlayers) {
        let stockImage = randomCartoon();
        roomImages[newroom] = { reference: stockImage };
        roomVotes[newroom] = { total: 0 };
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      } /*
    } else if (newroom === "Arena #1" && roomSpotsTaken["Arena #1"] < 4) {
      // join new room, received as function parameter
      // check how many people are in the room after a person joins
      // sent message to OLD room
      // update socket session room title

      // socket.broadcast
      //   .to(socket.room)
      //   .emit(
      //     "updatechat",
      //     "SERVER",
      //     socket.username[1] + " has left this room"
      //   );
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);

      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.room = newroom;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);

      if (roomSpotsTaken["Arena #1"] === 4) {
        let stockImage = randomCartoon();
        roomImages[newroom] = { reference: stockImage };
        roomVotes[newroom] = { total: 0 };
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      }
    } else if (newroom === "Arena #2" && roomSpotsTaken["Arena #2"] < 4) {
      // join new room, received as function parameter
      // check how many people are in the room after a person joins
      // sent message to OLD room
      // update socket session room title

      // socket.broadcast
      //   .to(socket.room)
      //   .emit(
      //     "updatechat",
      //     "SERVER",
      //     socket.username[1] + " has left this room"
      //   );
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);

      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.room = newroom;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);

      if (roomSpotsTaken["Arena #2"] === 4) {
        console.log("before");
        let stockImage = randomImage();
        console.log("after");
        roomImages[newroom] = { reference: stockImage };
        roomVotes[newroom] = { total: 0 };
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      }
    } else if (newroom === "Arena #3" && roomSpotsTaken["Arena #3"] < 3) {
      // join new room, received as function parameter
      // check how many people are in the room after a person joins
      // sent message to OLD room
      // update socket session room title

      // socket.broadcast
      //   .to(socket.room)
      //   .emit(
      //     "updatechat",
      //     "SERVER",
      //     socket.username[1] + " has left this room"
      //   );
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);

      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.room = newroom;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);

      if (roomSpotsTaken["Arena #3"] === 3) {
        let stockImage = randomRandom();
        roomImages[newroom] = { reference: stockImage };
        roomVotes[newroom] = { total: 0 };
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      }
    } else if (newroom === "Arena #4" && roomSpotsTaken["Arena #4"] < 2) {
      // join new room, received as function parameter
      // check how many people are in the room after a person joins
      // sent message to OLD room
      // update socket session room title

      // socket.broadcast
      //   .to(socket.room)
      //   .emit(
      //     "updatechat",
      //     "SERVER",
      //     socket.username[1] + " has left this room"
      //   );
      roomSpotsTaken[socket.room] -= 1;
      socket.leave(socket.room);

      socket.join(newroom);
      roomSpotsTaken[newroom] += 1;
      socket.room = newroom;

      socket.broadcast
        .to(newroom)
        .emit(
          "updatechat",
          "SERVER",
          socket.username[1] + " has joined this room"
        );
      socket.emit("updaterooms", rooms, newroom);

      if (roomSpotsTaken["Arena #4"] === 2) {
        let stockImage = randomRandom();
        roomImages[newroom] = { reference: stockImage };
        roomVotes[newroom] = { total: 0 };
        io.in(newroom).emit("displayreference", roomImages[newroom]);
      }*/
    } else {
      console.log("Room Full, Sorry");
    }

    io.emit("updatespots", roomSpotsTaken());
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
    if (
      socket.room === "Arena #3" &&
      Object.keys(roomImages[socket.room]).length === 4
    ) {
      for (const user of Object.keys(roomImages[socket.room])) {
        if (user !== "reference") {
          roomVotes[socket.room][roomImages[socket.room][user]] = 0;
        }
      }
      io.in(socket.room).emit("displayphotos", roomImages[socket.room]);
    }
    if (
      socket.room === "Arena #4" &&
      Object.keys(roomImages[socket.room]).length === 3
    ) {
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
    } else if (
      socket.room === "Arena #3" &&
      roomVotes[socket.room].total === 3
    ) {
      io.in(socket.room).emit(
        "displaywinner",
        determineWinner(roomVotes[socket.room])
      );
    } else if (
      socket.room === "Arena #4" &&
      roomVotes[socket.room].total === 2
    ) {
      io.in(socket.room).emit(
        "displaywinner",
        determineWinner(roomVotes[socket.room])
      );
    }
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function() {
    // echo globally that this client has left

    // socket.broadcast.emit(
    //   "updatechat",
    //   "SERVER",
    //   socket.username[1] + " has disconnected"
    // );
    socket.leave(socket.room);
    socket.disconnect();
  });

  socket.on("leave", function() {
    let room = rooms.find(room => room.name === socket.room);
    let lobby = rooms.find(room => room.name === "Lobby");
    room.players--;
    lobby.players++;
    if (room.players === 0) {
      io.emit("updatespots", roomSpotsTaken());
    }
  });
});
