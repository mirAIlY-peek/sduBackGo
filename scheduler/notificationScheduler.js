// const cron = require("node-cron");
// const UserEventSelection = require("../models/UserEventSelection");
// const Event = require("../models/Event");
// const bot = require("../bot/telegramBot"); // Путь к вашему экземпляру Telegram бота
//
// // Функция для отправки уведомлений
// const sendNotification = async () => {
//     const currentTime = new Date();
//
//     // Находим события, для которых нужно отправить уведомления
//     const events = await Event.find();
//     events.forEach(async (event) => {
//         const eventTime = new Date(event.eventDate);
//         const diff24h = eventTime - currentTime - 24 * 60 * 60 * 1000; // 24 часа
//         const diff1h = eventTime - currentTime - 60 * 60 * 1000; // 1 час
//
//         if (diff24h <= 0 && diff24h > -60 * 60 * 1000) {
//             // Уведомление за 24 часа
//             const users = await UserEventSelection.find({ eventId: event._id });
//             users.forEach(user => {
//                 bot.sendMessage(user.chatId, `⏳ Напоминаем, что через 24 часа начнется событие: ${event.title}`);
//             });
//         }
//
//         if (diff1h <= 0 && diff1h > -60 * 1000) {
//             // Уведомление за 1 час
//             const users = await UserEventSelection.find({ eventId: event._id });
//             users.forEach(user => {
//                 bot.sendMessage(user.chatId, `⏰ Внимание! Через 1 час начнется событие: ${event.title}`);
//             });
//         }
//     });
// };
//
// // Настройка cron задачи, чтобы она выполнялась каждую минуту
// cron.schedule("* * * * *", sendNotification);
//
// module.exports = sendNotification;
