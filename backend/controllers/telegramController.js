const shopService = require("../services/shopService");
const telegramService = require("../services/telegramService");

const WELCOME_MESSAGE =
  "🏪 Welcome to RentalApp Bot!\n\n" +
  "This bot sends you rent reminders for your shop.\n\n" +
  "Please enter your <b>shop number</b> to connect your account:";

const SUCCESS_MESSAGE =
  "✅ Your shop has been successfully connected!\n\n" +
  "You will receive rent reminders before the payment due date.";

const NOT_FOUND_MESSAGE =
  "❌ Shop number not found.\n\n" +
  "Please contact the marketplace owner to register your shop.";

async function handleWebhook(req, res) {
  const update = req.body;

  try {
    if (update.message) {
      await handleMessage(update.message);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook handler error:", error.message);
    res.sendStatus(200);
  }
}

async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || "").trim();

  if (text === "/start") {
    await telegramService.sendMessage(chatId, WELCOME_MESSAGE);
    return;
  }

  const shop = shopService.getByShopNumber(text);
  if (shop) {
    shopService.updateTelegramChatId(text, chatId);
    await telegramService.sendMessage(chatId, SUCCESS_MESSAGE);
    console.log(`Shop ${text} connected to chat ${chatId}`);
  } else {
    await telegramService.sendMessage(chatId, NOT_FOUND_MESSAGE);
  }
}

module.exports = { handleWebhook };
