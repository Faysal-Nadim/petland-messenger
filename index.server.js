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

const io = socketIO(server, {
  cors: {
    origin: "*", // Adjust this to be more restrictive in production
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: "*" }));
app.options("*", cors());
app.use(express.json());

app.post("/api/v1/create-chat", (req, res) => {
  const { userOne, userTwo, userOneName, userTwoName, request } = req.body;

  Chat.findOne({ userOne: userOne, userTwo: userTwo, request: request }).exec(
    (error, chatroom) => {
      if (error) {
        return res.status(400).json({ msg: "Something Went Wrong" });
      }
      if (chatroom) {
        return res.status(200).json(chatroom);
      } else {
        const _chatroom = new Chat({
          ID: Math.floor(100000 + Math.random() * 900000),
          userOne,
          userTwo,
          userOneName,
          userTwoName,
          request,
          chats: [
            {
              sender: userTwo,
              receiver: userOne,
              msgType: "text",
              isFlagged: false,
              msg: "Hi",
            },
          ],
        });

        _chatroom.save((error, c) => {
          if (error) {
            return res.status(400).json({ msg: "Something Went Wrong" });
          }
          if (c) {
            return res.status(201).json(c);
          }
        });
      }
    }
  );
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
  const { sender, receiver, msgType, isFlagged, msg, chatRoomID } = req.body;
  Chat.findOneAndUpdate(
    { ID: chatRoomID },
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
      return res.status(201).json({ chats });
    }
  });
});

app.post("/api/v1/get-chat-by-id", (req, res) => {
  Chat.findOne({ ID: req.body.ID }).exec((error, chat) => {
    if (error) {
      return res.status(400).json({ msg: "Something Went Wrong" });
    }
    if (chat) {
      return res.status(201).json({ chat });
    }
  });
});

io.on("connection", (socket) => {
  // console.log("User connected:", socket.id);

  socket.on("chatroom", (data) => {
    Chat.findOne({ ID: data.ID }).exec((error, chat) => {
      io.emit("chatroom", chat);
    });
  });

  socket.on("joinRoom", (data) => {
    socket.join(data.chatRoomID);
  });

  // Listen for incoming messages
  socket.on("message", (data) => {
    // console.log("Received message");
    // Save the message to MongoDB

    const { sender, receiver, msgType, isFlagged, msg, chatRoomID } = data;
    Chat.findOneAndUpdate(
      { ID: chatRoomID },
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
      socket.to(chatRoomID).emit("message", chats);
    });
    // Broadcast the message to all connected clients
    // io.emit("message", data);
  });

  // Listen for user disconnection
  socket.on("disconnect", () => {
    // console.log("User disconnected:", socket.id);
  });
});

// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
