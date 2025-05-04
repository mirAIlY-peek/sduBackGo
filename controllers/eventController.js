const Event = require("../models/Event");

const createEvent = async (req, res) => {
    try {
        const eventData = req.body;
        eventData.image = req.file ? req.file.path : "";
        const newEvent = new Event(eventData);
        await newEvent.save();
        res.status(201).json(newEvent);
    } catch (error) {
        res.status(500).json({ error: "Failed to save the event to MongoDB" });
    }
};

const getEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch events from MongoDB" });
    }
};

const getEventById = async (req, res) => {
    const { id } = req.params;
    try {
        const event = await Event.findById(id);
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch event from MongoDB" });
    }
};

const likeEvent = async (req, res) => {
    const { eventId } = req.params;
    try {
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        event.likes += 1;
        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { createEvent, getEvents, getEventById, likeEvent };
