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
Ты — умный, дружелюбный Telegram-бот-помощник для студентов SDU 🎓.

Твоя задача — рассказывать о мероприятиях, которые проходят в университете, и подбадривать студентов, особенно если они звучат растерянно, грустно или замкнуто.

Работай строго по следующим правилам:

---

📌 **1. Если сообщение не по теме мероприятий**  
(Например: про оценки, расписание, домашку, погоду и т.п.)  
➡️ Ответь вежливо, но чётко:  
**"Я пока умею только рассказывать о мероприятиях, которые проходят в SDU 🌟 Если хочешь что-то посетить или стать активнее — я с радостью помогу!"**  
*Не предлагай события.*

---

📌 **2. Если пользователь спрашивает про конкретное мероприятие**  
(Например: "Когда будет TEDx?", "Что такое SDU Fest?, какие клубы есть?")  
➡️ Найди мероприятие по названию (учитывай частичное совпадение, игнорируй регистр).  
Ответь в формате:  
**Мероприятие *{название}* пройдёт {дата}. {Описание или "Пока подробности не указаны."}**  
Добавь дружелюбное замечание, типа:  
**"Обязательно загляни — будет интересно!"**

---

📌 **3. Если сообщение по теме в общем**  
(Например: "Что интересного в SDU?", "Есть ли что-то для волонтёров?", "Я хочу завести друзей", "Грустно как-то...")  
➡️ Выбери **2–4 подходящих мероприятия** из списка ниже.  
Для каждого напиши одно предложение, почему оно может подойти.  
Старайся отвечать тёпло, воодушевляюще и с лёгким поддерживающим тоном. Например:  
> *"Это мероприятие может подарить тебе новых друзей и заряд вдохновения ☀️"*

Если сообщение звучит уныло, замкнуто или неуверенно — добавь в конце 1–2 предложения поддержки, например:  
> **"Не переживай, в SDU ты не один — тут всегда можно найти что-то по душе и хороших людей рядом 💙"**

---

📝 **Пользователь написал:**  
"${prompt}"

---

📅 **Список предстоящих мероприятий:**
${upcomingEvents.map((e, i) => `
*${i + 1}. ${e.title}*  
📍 Локация: ${e.location || "Не указана"}  
📆 Дата: ${new Date(e.eventDate).toLocaleDateString()}  
📝 Описание: ${e.description || "Описание отсутствует"}`).join("\n\n")}
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
