const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Token via env var or CLI arg
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.argv[2];
if (!TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN not provided.");
  console.error("Provide it as env var or as first argument:");
  console.error("  TELEGRAM_BOT_TOKEN=123:ABC node app/(tabs)/bot.js");
  process.exit(1);
}

const bot = new Telegraf(TOKEN);
// Minimal HTTP API so the mobile app can register reminders programmatically
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const appServer = express();
appServer.use(cors());
appServer.use(bodyParser.json());
const HTTP_PORT = process.env.BOT_HTTP_PORT || 3001;

// Data persistence for reminders
const DATA_DIR = path.resolve(__dirname, "data");
const REMINDERS_FILE = path.join(DATA_DIR, "reminders.json");
let reminders = [];

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(REMINDERS_FILE)) fs.writeFileSync(REMINDERS_FILE, "[]");
};

const loadReminders = () => {
  try {
    const raw = fs.readFileSync(REMINDERS_FILE, "utf8");
    reminders = JSON.parse(raw || "[]");
  } catch (e) {
    reminders = [];
  }
};

const saveReminders = () => {
  try {
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
  } catch (e) {
    console.error("Failed to save reminders:", e);
  }
};

const scheduleTimeouts = () => {
  // cancel existing timers
  reminders.forEach((r) => {
    if (r._timeout) {
      clearTimeout(r._timeout);
      delete r._timeout;
    }
  });

  reminders.forEach((r) => {
    if (r.sent) return;
    const due = new Date(r.dueDate);
    const offset = r.offsetDays ?? 1; // days before due date
    const remindAt = new Date(due);
    remindAt.setDate(due.getDate() - offset);
    remindAt.setHours(9, 0, 0, 0);

    let ms = remindAt.getTime() - Date.now();
    if (ms <= 0) ms = 1000;

    r._timeout = setTimeout(async () => {
      try {
        await bot.telegram.sendMessage(
          r.chatId,
          `Reminder: rent for ${r.tenantName} is due on ${r.dueDate}. Please pay on time.`,
        );
        r.sent = true;
        saveReminders();
      } catch (err) {
        console.warn("Failed to send reminder to", r.chatId, err);
      }
    }, ms);
  });
};

// HTTP endpoint to register a reminder programmatically
appServer.post("/register", (req, res) => {
  const { chatId, tenantName, dueDate, repeatDays } = req.body || {};
  if (!chatId || !tenantName || !dueDate) {
    return res
      .status(400)
      .json({ error: "Missing chatId, tenantName or dueDate" });
  }

  const repeat = Number(repeatDays) || 1;
  // create reminders for each offset day (1..repeat)
  for (let i = 1; i <= repeat; i++) {
    // avoid duplicate: same chatId, tenantName, dueDate, offset
    const exists = reminders.find(
      (r) =>
        String(r.chatId) === String(chatId) &&
        r.tenantName === tenantName &&
        r.dueDate === dueDate &&
        (r.offsetDays ?? 1) === i,
    );
    if (exists) continue;

    reminders.push({
      chatId: String(chatId),
      tenantName,
      dueDate,
      createdAt: new Date().toISOString(),
      sent: false,
      offsetDays: i,
    });
  }
  saveReminders();
  scheduleTimeouts();
  return res.json({ ok: true });
});

appServer.post("/registerMany", (req, res) => {
  const items = req.body || [];
  if (!Array.isArray(items))
    return res.status(400).json({ error: "Expected array" });
  items.forEach((it) => {
    const { chatId, tenantName, dueDate, repeatDays } = it;
    if (!chatId || !tenantName || !dueDate) return;
    const repeat = Number(repeatDays) || 1;
    for (let i = 1; i <= repeat; i++) {
      const exists = reminders.find(
        (r) =>
          String(r.chatId) === String(chatId) &&
          r.tenantName === tenantName &&
          r.dueDate === dueDate &&
          (r.offsetDays ?? 1) === i,
      );
      if (exists) continue;
      reminders.push({
        chatId: String(chatId),
        tenantName,
        dueDate,
        createdAt: new Date().toISOString(),
        sent: false,
        offsetDays: i,
      });
    }
  });
  saveReminders();
  scheduleTimeouts();
  return res.json({ ok: true });
});

appServer.listen(HTTP_PORT, () => {
  console.log(`Bot HTTP API listening on port ${HTTP_PORT}`);
});

// Bot commands
bot.start((ctx) => {
  ctx.reply("Welcome to RentalYoheBot. Use /help for commands.");
});

bot.command("help", (ctx) => {
  ctx.reply(
    "/remindme YYYY-MM-DD TenantName - register a rent reminder\n" +
      "/myreminders - list your reminders\n" +
      "/cancel TenantName - cancel a reminder\n" +
      "/help - show this help",
  );
});

bot.command("remindme", (ctx) => {
  const parts = ctx.message.text.split(" ").slice(1);
  if (parts.length < 2) {
    ctx.reply("Usage: /remindme YYYY-MM-DD TenantName");
    return;
  }
  const dueDate = parts[0];
  const tenantName = parts.slice(1).join(" ");
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    ctx.reply("Invalid date. Use YYYY-MM-DD");
    return;
  }

  const entry = {
    chatId: String(ctx.chat.id),
    tenantName,
    dueDate,
    createdAt: new Date().toISOString(),
    sent: false,
  };

  reminders.push(entry);
  saveReminders();
  scheduleTimeouts();
  ctx.reply(
    `Reminder registered for ${tenantName} on ${dueDate}. You'll be notified one day before.`,
  );
});

bot.command("myreminders", (ctx) => {
  const my = reminders.filter((r) => String(r.chatId) === String(ctx.chat.id));
  if (my.length === 0) {
    ctx.reply("No reminders registered for this chat.");
    return;
  }
  const lines = my.map(
    (r) =>
      `${r.tenantName} — due ${r.dueDate} — sent: ${r.sent ? "yes" : "no"}`,
  );
  ctx.reply(lines.join("\n"));
});

bot.command("cancel", (ctx) => {
  const name = ctx.message.text.split(" ").slice(1).join(" ");
  if (!name) {
    ctx.reply("Usage: /cancel TenantName");
    return;
  }
  const before = reminders.length;
  reminders = reminders.filter(
    (r) => !(String(r.chatId) === String(ctx.chat.id) && r.tenantName === name),
  );
  saveReminders();
  scheduleTimeouts();
  ctx.reply(
    before === reminders.length
      ? `No reminder found for ${name}.`
      : `Cancelled reminder for ${name}.`,
  );
});

(async () => {
  try {
    ensureDataDir();
    loadReminders();
    scheduleTimeouts();
    await bot.launch();
    console.log("RentalYoheBot launched and reminders loaded.");
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (err) {
    console.error("Bot startup failed:", err);
    process.exit(1);
  }
})();
