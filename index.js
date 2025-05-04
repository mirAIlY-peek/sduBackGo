// server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const TelegramBot = require("node-telegram-bot-api");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const aiRoutes = require("./routes/aiRoutes");

const Event = require("./models/Event");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:5174" }));

connectDB();

app.get("/", (req, res) => {
   res.send("Node.js backend with AI integration and Telegram Bot");
});

app.use("/api", aiRoutes);
app.use(authRoutes);
app.use(eventRoutes);
app.use(ticketRoutes);

// Telegram Bot Setup
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot("7685820545:AAFNEJYUQ6T725r-oy78kVAEg6Z8BHD4iWQ", { polling: true });

const { generateRecommendations } = require("./controllers/aiController");


const { generateRecommendationsDirect } = require("./ai/chatAI"); // или как у тебя называется AI-файл

bot.on("message", async (msg) => {
   const chatId = msg.chat.id;
   const text = msg.text;

   // Пропускаем команды, они уже обрабатываются отдельно
   if (text.startsWith("/")) return;

   try {
      bot.sendChatAction(chatId, "typing");

      const aiReply = await generateRecommendationsDirect(text);

      bot.sendMessage(chatId, aiReply.response || "🤖 Что-то пошло не так...");

      // Если есть ID событий — покажи названия
      if (aiReply.recommendedEvents && aiReply.recommendedEvents.length > 0) {
         const events = await Event.find({ _id: { $in: aiReply.recommendedEvents } });

         let eventMsg = "\n🎯 Рекомендуемые события:\n\n";
         events.forEach((event) => {
            eventMsg += `• ${event.title} — ${event.location || "Место не указано"}\n📅 ${new Date(event.eventDate).toLocaleDateString()}\n\n`;
         });

         bot.sendMessage(chatId, eventMsg);
      }

   } catch (error) {
      console.error("Ошибка AI:", error);
      bot.sendMessage(chatId, "❌ Произошла ошибка при обработке запроса.");
   }
});

bot.onText(/\/start/, (msg) => {
   const chatId = msg.chat.id;

   const welcomeMessage = `👋 Привет, ${msg.from.first_name || "гость"}!

Добро пожаловать в Go SDU bot 🎉
Вот что я умею:`;

   const keyboard = {
      reply_markup: {
         keyboard: [
            [{ text: "/events" }, { text: "/relax" }],
            [{ text: "/subscribe" }, { text: "/help" }]
         ],
         resize_keyboard: true,
         one_time_keyboard: false
      }
   };

   bot.sendMessage(chatId, welcomeMessage, keyboard);
});

const Subscriber = require("./models/Subscriber");

bot.onText(/\/subscribe/, async (msg) => {
   const chatId = msg.chat.id;

   try {
      const existing = await Subscriber.findOne({ chatId });
      if (existing) {
         return bot.sendMessage(chatId, "✅ Вы уже подписаны на уведомления.");
      }

      await Subscriber.create({ chatId });
      bot.sendMessage(chatId, "🔔 Вы успешно подписались на уведомления о новых событиях!");
   } catch (err) {
      console.error("Ошибка подписки:", err);
      bot.sendMessage(chatId, "❌ Не удалось подписаться.");
   }
});


bot.onText(/\/relax/, async (msg) => {
   const chatId = msg.chat.id;
   const prompt = "Хочу отдохнуть и развлечься на мероприятии";

   try {
      bot.sendChatAction(chatId, "typing");
      const aiReply = await generateRecommendationsDirect(prompt);
      bot.sendMessage(chatId, aiReply.response);

      if (aiReply.recommendedEvents.length > 0) {
         const events = await Event.find({ _id: { $in: aiReply.recommendedEvents } });
         let eventMsg = "🎉 Подходящие мероприятия для отдыха:\n\n";
         events.forEach((event) => {
            eventMsg += `• ${event.title} — ${event.location}\n📅 ${new Date(event.eventDate).toLocaleDateString()}\n\n`;
         });
         bot.sendMessage(chatId, eventMsg);
      }
   } catch (err) {
      bot.sendMessage(chatId, "⚠️ Ошибка при получении рекомендаций.");
   }
});


bot.onText(/\/events/, async (msg) => {
   const chatId = msg.chat.id;

   try {
      const events = await Event.find();
      if (events.length === 0) {
         return bot.sendMessage(chatId, "Событий пока нет.");
      }

      let message = "📅 Список ближайших событий:\n\n";
      events.forEach((event, i) => {
         const eventDate = event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "Не указана";
         const eventTime = event.eventTime || "Не указано";
         const price = event.ticketPrice === 0 ? "Бесплатно" : `${event.ticketPrice}₸`;
         const location = event.location || "Не указано";

         message += `✨ ${event.title}\n`;
         message += `📍 Место: ${location}\n`;
         message += `🗓️ Дата: ${eventDate} ${eventTime}\n`;
         message += `💰 Билет: ${price}\n`;
         if (event.organizedBy) {
            message += `🏢 Организатор: ${event.organizedBy}\n`;
         }
         message += `\n`;
      });

      bot.sendMessage(chatId, message);
   } catch (error) {
      console.error("Ошибка получения событий:", error);
      bot.sendMessage(chatId, "❌ Ошибка при получении списка событий.");
   }
});

bot.onText(/\/help/, (msg) => {
   const chatId = msg.chat.id;

   const helpText = `
📌 *Доступные команды:*

/start — показать кнопки
/events — список ближайших мероприятий
/relax — рекомендации, как отдохнуть
/help — показать список команд
`;

   bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
});


bot.onText(/\/create/, (msg) => {
   const chatId = msg.chat.id;
   bot.sendMessage(chatId, "📝 Создание событий пока доступно только через веб-интерфейс.");
});



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
