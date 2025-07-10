const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const bodyParser = require("body-parser");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(bodyParser.json());

const rooms = {};

app.get("/:room", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/:room/agent", (req, res) => {
  res.sendFile(__dirname + "/public/agent.html");
});

app.post("/submit_guess", (req, res) => {
  const { room_id, guess } = req.body;
  const room = rooms[room_id];
  if (!room || !room.human || !room.bot) {
    return res.json({ result: "Room not ready or invalid." });
  }
  const result = guess === room.human ? "Correct! 🎉" : "Wrong 😅";
  return res.json({ result });
});

io.on("connection", (socket) => {
  socket.on("join", ({ room }) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = { users: [] };
    if (!rooms[room].users.includes(socket.id)) {
      rooms[room].users.push(socket.id);
    }
  });

  socket.on("message_to", ({ to, message, room }) => {
    io.to(room).emit("message_to_agent", { message, from: to });
  });

  socket.on("agent_reply", ({ room, reply, to }) => {
    io.to(room).emit("reply_from", { reply, to });
  });
});

http.listen(PORT, () => {
  console.log("Server running on port", PORT);
});