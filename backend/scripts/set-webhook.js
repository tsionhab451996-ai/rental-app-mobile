/**
 * Standalone script to set or update the Telegram webhook URL.
 * Usage: node scripts/set-webhook.js
 *
 * Requires BASE_URL in .env to be set to your server's public URL.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is not set in .env");
  process.exit(1);
}

if (!BASE_URL) {
  console.error("BASE_URL is not set in .env");
  process.exit(1);
}

const webhookUrl = `${BASE_URL.replace(/\/$/, "")}/telegram/webhook`;

async function main() {
  try {
    console.log(`Setting webhook to: ${webhookUrl}`);
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        allowed_updates: ["message"],
      },
    );
    console.log("Response:", JSON.stringify(response.data, null, 2));
    if (response.data.ok) {
      console.log("✅ Webhook set successfully");
    } else {
      console.error("❌ Failed to set webhook:", response.data.description);
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

main();
