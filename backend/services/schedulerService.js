const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const shopService = require("./shopService");
const telegramService = require("./telegramService");

const TRACKING_FILE = path.join(__dirname, "..", "data", "sent_reminders.json");

const ETHIOPIAN_MONTHS = [
  { am: "መስከረም", en: "Meskerem" },
  { am: "ጥቅምት", en: "Tikimt" },
  { am: "ኅዳር", en: "Hidar" },
  { am: "ታኅሣሥ", en: "Tahsas" },
  { am: "ጥር", en: "Tir" },
  { am: "የካቲት", en: "Yekatit" },
  { am: "መጋቢት", en: "Megabit" },
  { am: "ሚያዝያ", en: "Miyazya" },
  { am: "ግንቦት", en: "Ginbot" },
  { am: "ሰኔ", en: "Sene" },
  { am: "ሐምሌ", en: "Hamle" },
  { am: "ነሐሴ", en: "Nehase" },
  { am: "ጳጉሜ", en: "Pagume" },
];

function toEthiopianDate(gregorianDate) {
  const gYear = gregorianDate.getFullYear();
  const gMonth = gregorianDate.getMonth() + 1;
  const gDay = gregorianDate.getDate();

  const a = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - a;
  const m = gMonth + 12 * a - 3;
  const jdn =
    gDay +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const meta = ETHIOPIAN_MONTHS[ethMonth - 1] || ETHIOPIAN_MONTHS[0];
  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameEn: meta.en,
    monthNameAm: meta.am,
  };
}

function ethiopianToGregorian(ethYear, ethMonth, ethDay) {
  const jdn =
    1723856 +
    365 * ethYear +
    Math.floor(ethYear / 4) +
    30 * (ethMonth - 1) +
    ethDay -
    1;
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const day = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const month = j + 2 - 12 * l4;
  const year = 100 * (n - 49) + i + l4;
  return new Date(year, month - 1, day);
}

function getEthiopianRentCycleDueInfo(currentDate = new Date()) {
  const eth = toEthiopianDate(currentDate);
  let targetYear = eth.year;
  let targetMonth = eth.month;

  // If in Pagume (month 13) or past Day 7 in any month, target upcoming monthly cycle's Day 7
  if (eth.month === 13) {
    targetMonth = 1;
    targetYear += 1;
  } else if (eth.day > 7) {
    if (targetMonth === 12) {
      targetMonth = 1;
      targetYear += 1;
    } else {
      targetMonth += 1;
    }
  }

  const dueDateGregorian = ethiopianToGregorian(targetYear, targetMonth, 7);
  const currentUtc = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );
  const dueUtc = Date.UTC(
    dueDateGregorian.getFullYear(),
    dueDateGregorian.getMonth(),
    dueDateGregorian.getDate(),
  );
  const daysUntilDue = Math.round((dueUtc - currentUtc) / (1000 * 60 * 60 * 24));
  const monthMeta = ETHIOPIAN_MONTHS[targetMonth - 1] || ETHIOPIAN_MONTHS[0];
  const ethDueDateFormatted = `${monthMeta.en} 7 (${monthMeta.am} 7)`;
  const cycleKey = `${targetYear}_${targetMonth}`;

  return {
    billingYear: targetYear,
    billingMonth: targetMonth,
    dueDay: 7,
    dueDateGregorian,
    daysUntilDue,
    ethDueDateFormatted,
    ethMonthNameEn: monthMeta.en,
    ethMonthNameAm: monthMeta.am,
    cycleKey,
  };
}

function loadTrackingLog() {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      const raw = fs.readFileSync(TRACKING_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

function saveTrackingLog(log) {
  try {
    const dir = path.dirname(TRACKING_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(log, null, 2));
  } catch (err) {
    console.error("Failed to save reminder tracking log:", err.message);
  }
}

function buildTelegramReminderMessage(tenantName, unitNumber, days, ethDueDateStr) {
  const unitLabel =
    unitNumber.toLowerCase().startsWith("unit") ||
    unitNumber.toLowerCase().startsWith("shop")
      ? unitNumber
      : `Unit ${unitNumber}`;

  return `ሰላም ${tenantName}፣ ይህ የ${unitLabel} የኪራይ ክፍያዎ በ${days} ቀናት ውስጥ በ${ethDueDateStr} የሚደርስ መሆኑን የሚያስታውስ ወዳጃዊ መልዕክት ነው። እባክዎ ክፍያዎን በወቅቱ ያጠናቅቁ።`;
}

async function sendDueDateReminders(currentDate = new Date()) {
  console.log(`[${new Date().toISOString()}] Running automated Telegram due-date check...`);
  try {
    const dueInfo = getEthiopianRentCycleDueInfo(currentDate);
    const daysUntilDue = dueInfo.daysUntilDue;

    // Only dispatch at exactly 7 days, 5 days, and 3 days prior
    if (daysUntilDue !== 7 && daysUntilDue !== 5 && daysUntilDue !== 3) {
      console.log(`Rent due in ${daysUntilDue} days on ${dueInfo.ethDueDateFormatted}. (Reminders trigger at 7, 5, or 3 days).`);
      return;
    }

    const shops = shopService.getAll().filter((s) => s.telegramChatId);
    if (shops.length === 0) {
      console.log("No shops with active Telegram chat ID.");
      return;
    }

    const sentLog = loadTrackingLog();
    let sentCount = 0;

    for (const shop of shops) {
      const tenantName = shop.tenantName || shop.shopName || "Tenant";
      const unitNumber = shop.shopNumber || "Unit";
      const shopId = shop.id || shop.shopNumber;

      const trackingKey = `tg_remind_${shopId}_${dueInfo.cycleKey}_${daysUntilDue}d`;
      if (sentLog[trackingKey]) {
        continue;
      }

      const message = buildTelegramReminderMessage(
        tenantName,
        unitNumber,
        daysUntilDue,
        dueInfo.ethDueDateFormatted,
      );

      try {
        await telegramService.sendMessage(shop.telegramChatId, message);
        console.log(`Reminder sent to ${tenantName} (${unitNumber}) for ${daysUntilDue} days prior.`);
        sentLog[trackingKey] = new Date().toISOString();
        sentCount++;
      } catch (err) {
        console.error(`Failed to send reminder to ${shop.telegramChatId}:`, err.message);
      }
    }

    if (sentCount > 0) {
      saveTrackingLog(sentLog);
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
  console.log("Scheduler started: daily Ethiopian reminder check at 8:00 AM");
  // Also run once immediately on startup
  sendDueDateReminders();
}

module.exports = {
  start,
  sendDueDateReminders,
  getEthiopianRentCycleDueInfo,
  buildTelegramReminderMessage,
};
