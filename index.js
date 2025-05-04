const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

// Импортируем Google Gemini AI
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Event = require("./models/Event");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: "http://localhost:5174" }));

connectDB();

// Инициализируем Google Gemini AI
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
   console.error('GEMINI_API_KEY is not set in .env file.');
   process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Главная страница
app.get("/", (req, res) => {
   res.send("Node.js backend with AI integration");
});

// Маршрут для генерации контента с использованием AI
app.post("/api/generate", async (req, res) => {
   try {
      const { prompt } = req.body;

      if (!prompt) {
         return res.status(400).json({ error: "Prompt is required" });
      }

      // Получаем все события из базы данных
      const events = await Event.find();

      if (!events || events.length === 0) {
         return res.status(404).json({ error: "No events found in the database" });
      }

      // Фильтруем только предстоящие события
      const currentDate = new Date();
      const upcomingEvents = events.filter(event => {
         const eventDate = new Date(event.eventDate);
         return eventDate >= currentDate || eventDate.toDateString() === currentDate.toDateString();
      });

      if (upcomingEvents.length === 0) {
         return res.json({
            response: "I couldn't find any upcoming events in our database. Please check back later!",
            recommendedEvents: []
         });
      }

      // Create an enhanced prompt that asks the AI to recommend events based on user input
      const enhancedPrompt = `
      A user is looking for event recommendations and provided this request: "${prompt}"
      
      Here are the available upcoming events:
      ${upcomingEvents.map((event, index) => `
      Event ${index + 1}: 
      - ID: ${event._id}
      - Title: ${event.title}
      - Description: ${event.description || "No description provided"}
      - Date: ${new Date(event.eventDate).toLocaleDateString()}
      - Time: ${event.eventTime || "Not specified"}
      - Location: ${event.location || "Not specified"}
      - Price: ${event.ticketPrice === 0 ? 'Free' : `Rs. ${event.ticketPrice}`}
      - Organized by: ${event.organizedBy || "Not specified"}
      `).join('\n')}
      
      Based on the user's request, suggest 1-3 events that best match what they're looking for. 
      Provide a short explanation about why these events are good matches.
      
      Format your response in two parts:
      1. A brief explanation of your recommendations (2-3 sentences)
      2. A JSON array of event IDs in this format: ["id1", "id2", "id3"]
      
      Please keep your explanation concise and conversational as if speaking directly to the user.
      `;

      // Call the Gemini API
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(enhancedPrompt);
      const responseText = result.response.text();

      if (!responseText) {
         return res.status(500).json({ error: "Failed to generate response from Gemini" });
      }

      // Parse the response to extract the recommended event IDs
      try {
         // Extract JSON array from the response
         const jsonMatch = responseText.match(/\[.*?\]/s);
         let recommendedEvents = [];

         if (jsonMatch) {
            try {
               recommendedEvents = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
               console.error("Error parsing JSON from AI response:", parseError);
            }
         }

         // Extract the explanation text (everything before the JSON array)
         const explanation = jsonMatch
             ? responseText.split(jsonMatch[0])[0].trim()
             : responseText;

         res.json({
            response: explanation,
            recommendedEvents: recommendedEvents
         });

      } catch (parseError) {
         console.error("Error processing AI response:", parseError);
         res.json({
            response: responseText,
            recommendedEvents: []
         });
      }
   } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
   }
});

// Используем другие маршруты
app.use(authRoutes);
app.use(eventRoutes);
app.use(ticketRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
