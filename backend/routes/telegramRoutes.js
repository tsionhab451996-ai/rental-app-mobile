const express = require("express");
const router = express.Router();
const telegramController = require("../controllers/telegramController");

// Telegram webhook endpoint - receives updates from Telegram
router.post("/webhook", telegramController.handleWebhook);

module.exports = router;
