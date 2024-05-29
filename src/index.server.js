const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
const env = require("dotenv");
const cors = require("cors");
const Chat = require("./models/chatroom");

env.config();
// Connect to MongoDB
mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@petland.ebdjmfv.mongodb.net/?retryWrites=true&w=majority&appName=PetLand`,
    { dbName: "PetLand" }
  )
  .then(() => {
    console.log("Connected To Database");
  })
  .catch((err) => {
    console.log("Unable to connect" + err);
  });

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors({ origin: "*" }));
app.options("*", cors());
app.use(express.json());

app.get("/api/v1/create-chat", (req, res) => {
  const _chatroom = new Chat({
    ID: "404041",
    userOne: "6644c62d7ffdae526c4f6681",
    userTwo: "6644c6657ffdae526c4f6685",
  });

  _chatroom.save((error, chatroom) => {
    if (error) {
      return res.status(400).json({ msg: "Something Went Wrong" });
    }
    if (chatroom) {
      return res.status(201).json({ msg: "Chat Room Created" });
    }
  });
});

app.post("/api/v1/get-chat-by-user", (req, res) => {
  Chat.find({
    $or: [{ userOne: req.body.user }, { userTwo: req.body.user }],
  }).exec((error, chats) => {
    if (error) {
      return res.status(400).json({ msg: "Something Went Wrong", error });
    }
    if (chats) {
      return res.status(201).json({ chats });
    }
  });
});

app.post("/api/v1/update-quote-state", (req, res) => {
  Chat.findOneAndUpdate(
    { ID: req.body.chatRoomID },
    {
      $set: {
        isQuoteSent: true,
      },
    },
    { new: true }
  ).exec((error, chat) => {
    if (error) {
      return res.status(400).json({ msg: "Something Went Wrong", error });
    }
    if (chat) {
      return res.status(201).json({ chat });
    }
  });
});

app.post("/api/v1/submit-msg", (req, res) => {
  const { sender, receiver, msgType, isFlagged, msg } = req.body;
  Chat.findOneAndUpdate(
    { ID: "404040" },
    {
      $push: {
        chats: {
          sender: sender,
          receiver: receiver,
          msgType: msgType,
          isFlagged: isFlagged,
          msg: msg,
        },
      },
    },
    { new: true }
  ).exec((error, chats) => {
    if (error) {
      return res.status(400).json({ msg: "Something Went Wrong" });
    }
    if (chats) {
      return res.status(201).json({ msg: "Chat Room Created" });
    }
  });
});

// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("chatroom", (data) => {
    Chat.findOne({ ID: data.ID }).exec((error, chat) => {
      io.emit("chatroom", chat);
    });
  });

  // Listen for incoming chat messages
  socket.on("chat message", (data) => {
    console.log("Received message");

    // Save the message to MongoDB

    const { sender, receiver, msgType, isFlagged, msg } = data;
    Chat.findOneAndUpdate(
      { ID: "404041" },
      {
        $push: {
          chats: {
            sender: sender,
            receiver: receiver,
            msgType: msgType,
            isFlagged: isFlagged,
            msg: msg,
          },
        },
      },
      { new: true }
    ).exec((error, chats) => {
      io.emit("chat message", chats);
    });
    // Broadcast the message to all connected clients
    // io.emit("chat message", data);
  });

  // Listen for user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
