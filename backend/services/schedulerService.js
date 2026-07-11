const cron = require("node-cron");
const shopService = require("./shopService");
const telegramService = require("./telegramService");

function formatCurrency(value) {
  return `ETB ${Number(value).toFixed(2)}`;
}

async function sendDueDateReminders() {
  console.log(`[${new Date().toISOString()}] Running daily due-date check...`);
  try {
    const shops = shopService.getShopsDueTomorrow();
    if (shops.length === 0) {
      console.log("No shops with due dates tomorrow.");
      return;
    }
    for (const shop of shops) {
      const message =
        `🏪 <b>Rent Reminder</b>\n\n` +
        `Shop: <b>${shop.shopNumber}</b>\n` +
        `Rent Amount: <b>${formatCurrency(shop.rentAmount)}</b>\n` +
        `Due Date: <b>${shop.dueDate}</b>\n\n` +
        `Please make your payment on time to avoid late fees. ` +
        `If you have already paid, please ignore this message.`;

      try {
        await telegramService.sendMessage(shop.telegramChatId, message);
        console.log(`Reminder sent to shop ${shop.shopNumber} (chat: ${shop.telegramChatId})`);
      } catch (err) {
        console.error(`Failed to send reminder for shop ${shop.shopNumber}:`, err.message);
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error.message);
  }
}

function start() {
  // Run every day at 8:00 AM
  cron.schedule("0 8 * * *", () => {
    sendDueDateReminders();
  });
  console.log("Scheduler started: daily reminder at 8:00 AM");
  // Also run once immediately on startup for testing
  sendDueDateReminders();
}

module.exports = { start, sendDueDateReminders };
