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
        const upcomingEvents = events.filter(event =>
            event.eventDate && new Date(event.eventDate) >= currentDate
        );


        const fullPrompt = `
Ты — умный и дружелюбный помощник для студентов SDU.

Твоя цель — помочь студенту стать активным участником жизни вуза, посещая интересные и полезные мероприятия. Рекомендуй те, что помогают развиваться, заводить знакомства, становиться активистом и быть в курсе новостей кампуса.

Пользователь написал: "${prompt}"

Вот список предстоящих мероприятий:
${upcomingEvents.map((e, i) => `
${i + 1}.
Название: ${e.title}
ID: "${e._id}"
Локация: ${e.location || "Не указана"}
Дата: ${new Date(e.eventDate).toLocaleDateString()}
Описание: ${e.description || "Описание отсутствует"}`).join("\n\n")}

Выбери 2–4 мероприятия, подходящие под его запрос. Для каждого объясни в 1 предложении, почему оно подойдёт. НЕ упоминай ID в тексте.

🎯 В самом конце верни только JSON-массив ID подходящих мероприятий. Пример: ["id1", "id2"]
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
                const jsonCandidate = match[0].trim();
                if (jsonCandidate.startsWith("[") && jsonCandidate.endsWith("]")) {
                    ids = JSON.parse(jsonCandidate);
                }
            } catch (e) {
                console.warn("⚠️ JSON-парсинг не удался:", e);
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
