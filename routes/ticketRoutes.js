const express = require("express");
const { createTicket, getTickets, getUserTickets, deleteTicket } = require("../controllers/ticketController");

const router = express.Router();

router.post("/tickets", createTicket);
router.get("/tickets/:id", getTickets);
router.get("/tickets/user/:userId", getUserTickets);
router.delete("/tickets/:id", deleteTicket);

module.exports = router;
