const axios = require("axios");

function getBotToken() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN environment variable is not set");
  }
  return token;
}

function apiUrl(method) {
  return `https://api.telegram.org/bot${getBotToken()}/${method}`;
}

async function sendMessage(chatId, text) {
  try {
    const response = await axios.post(apiUrl("sendMessage"), {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    });
    return response.data;
  } catch (error) {
    console.error("Telegram sendMessage error:", error.response?.data || error.message);
    throw error;
  }
}

async function setWebhook(url) {
  try {
    const response = await axios.post(apiUrl("setWebhook"), {
      url,
      allowed_updates: ["message"],
    });
    console.log("Webhook set response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to set webhook:", error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  sendMessage,
  setWebhook,
};
