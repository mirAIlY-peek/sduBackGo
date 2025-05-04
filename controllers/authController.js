const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/User");
const jwtSecret = require("../config/auth");

const register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userDoc = await UserModel.create({
            name,
            email,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        });
        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    const userDoc = await UserModel.findOne({ email });

    if (!userDoc) {
        return res.status(404).json({ error: "User not found" });
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (!passOk) {
        return res.status(401).json({ error: "Invalid password" });
    }

    jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
            if (err) {
                return res.status(500).json({ error: "Failed to generate token" });
            }
            res.cookie("token", token).json(userDoc);
        }
    );
};

const logout = (req, res) => {
    res.cookie("token", "").json(true);
};

const profile = (req, res) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        // Можно вернуть всю инфу о пользователе по ID, если нужно:
        const user = await UserModel.findById(userData.id);
        res.json(user);
    });
};

module.exports = { register, login, logout, profile };
