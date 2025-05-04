const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    subscribedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Subscriber", subscriberSchema);
