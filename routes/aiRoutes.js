const express = require("express");
const router = express.Router();
const { generateRecommendations } = require("../controllers/aiController");

router.post("/generate", generateRecommendations);

module.exports = router;
