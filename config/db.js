const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Успешно подключено к MongoDB");
    } catch (error) {
        console.error("Oшибка подключения к MongoDB:", error.message);
    }
};

module.exports = connectDB;
