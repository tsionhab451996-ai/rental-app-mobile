require("dotenv").config();

const express = require("express");
const cors = require("cors");
const telegramRoutes = require("./routes/telegramRoutes");
const shopRoutes = require("./routes/shopRoutes");
const schedulerService = require("./services/schedulerService");
const telegramService = require("./services/telegramService");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "RentalApp Bot Backend is running" });
});

// Routes
app.use("/telegram", telegramRoutes);
app.use("/api/shops", shopRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Set up Telegram webhook
  const baseUrl = process.env.BASE_URL;
  if (baseUrl) {
    const webhookUrl = `${baseUrl.replace(/\/$/, "")}/telegram/webhook`;
    telegramService.setWebhook(webhookUrl).catch(err => {
      console.warn("Webhook setup failed:", err.response?.data?.description || err.message);
      console.warn("Update BOT_TOKEN in backend/.env with a real token from @BotFather");
    });
  } else {
    console.warn("BASE_URL not set. Webhook not configured. Set BASE_URL in .env");
  }

  // Start daily scheduler for rent reminders
  schedulerService.start();
});
