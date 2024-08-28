const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    ID: {
      type: String,
      required: true,
    },
    userOne: {
      type: String,
      required: true,
    },
    userOneName: {
      type: String,
      required: true,
    },
    userTwo: {
      type: String,
      required: true,
    },
    userTwoName: {
      type: String,
      required: true,
    },
    request: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["req", "stray"],
    },
    isQuoteSent: {
      type: Boolean,
      default: false,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
    chats: [
      {
        sender: {
          type: String,
        },
        receiver: {
          type: String,
        },
        msgType: {
          type: String,
          enum: ["text", "img"],
        },
        isFlagged: {
          type: Boolean,
        },
        msg: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
