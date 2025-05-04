const express = require("express");
const { createEvent, getEvents, getEventById, likeEvent } = require("../controllers/eventController");
const upload = require("../config/multerConfig");
const { chatWithStudent } = require('../service/telegramBot');

const router = express.Router();

router.post('/bot', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    const reply = await chatWithStudent(message);
    res.json({ reply });
});

router.post("/createEvent", upload.single("image"), createEvent);
router.get("/createEvent", getEvents);
router.get("/event/:id", getEventById);
router.post("/event/:eventId", likeEvent);

module.exports = router;
