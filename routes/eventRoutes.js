const express = require("express");
const { createEvent, getEvents, getEventById, likeEvent } = require("../controllers/eventController");
const upload = require("../config/multerConfig");

const router = express.Router();

router.post("/createEvent", upload.single("image"), createEvent);
router.get("/createEvent", getEvents);
router.get("/event/:id", getEventById);
router.post("/event/:eventId", likeEvent);

module.exports = router;
