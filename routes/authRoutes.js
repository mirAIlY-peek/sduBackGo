const express = require("express");
const { register, login, logout } = require("../controllers/authController");
const { profile } = require("../controllers/authController"); // Добавили

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", profile); // ← Вот этот маршрут

module.exports = router;
