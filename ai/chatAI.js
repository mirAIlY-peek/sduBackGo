// ai/chatAI.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Event = require("../models/Event");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateRecommendationsDirect(prompt) {
    try {
        const events = await Event.find();
        const currentDate = new Date();
        const upcomingEvents = events.filter(event => new Date(event.eventDate) >= currentDate);

        const fullPrompt = `
Ты умный бот-помощник для студентов. Пользователь написал: "${prompt}"

Вот список событий:
${upcomingEvents.map((e, i) => `
${i + 1}. ${e.title} | ${e.location} | ${new Date(e.eventDate).toLocaleDateString()} | ${e.description || "Описание отсутствует"}`).join("\n")}

Предложи, какие события подойдут под его запрос.
Ответь дружелюбно, но кратко.
В конце верни JSON массив ID подходящих событий, например: ["id1", "id2"],
Ответь дружелюбно, но обязательно в конце верни JSON массив ID подходящих событий. Только JSON без пояснений, например: ["id1", "id2"]

`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: fullPrompt }]
                }
            ]
        });

        const text = result.response.text();
        // Попытка найти JSON-массив в тексте
        const match = text.match(/\[.*\]/s);
        let ids = [];

        if (match) {
            try {
                ids = JSON.parse(match[0]);
            } catch (e) {
                console.warn("⚠️ AI не вернул корректный JSON. Ответ будет только текстом.");
            }
        }

// Возвращаем и текст, и ID, даже если массив пустой
        return {
            response: text.split(match?.[0])[0].trim(), // Текст без JSON
            recommendedEvents: ids
        };

    } catch (error) {
        console.error("Ошибка при генерации рекомендаций:", error);
        return {
            response: "Извините, произошла ошибка при обработке запроса.",
            recommendedEvents: []
        };
    }
}

module.exports = { generateRecommendationsDirect };
