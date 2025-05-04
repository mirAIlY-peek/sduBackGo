// models/UserEventSelection.js
const mongoose = require("mongoose");

const userEventSelectionSchema = new mongoose.Schema({
    chatId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    eventTitle: { type: String, required: true },
    eventDate: { type: Date, required: true },
    selectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserEventSelection", userEventSelectionSchema);
