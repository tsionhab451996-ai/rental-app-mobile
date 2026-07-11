const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "shops.json");

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readShops() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeShops(shops) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(shops, null, 2));
}

function getAll() {
  return readShops();
}

function getByShopNumber(shopNumber) {
  const shops = readShops();
  return shops.find(
    (s) => s.shopNumber?.toLowerCase() === shopNumber.toLowerCase(),
  );
}

function upsert(shopData) {
  const shops = readShops();
  const idx = shops.findIndex(
    (s) => s.shopNumber?.toLowerCase() === shopData.shopNumber?.toLowerCase(),
  );
  if (idx >= 0) {
    shops[idx] = { ...shops[idx], ...shopData };
  } else {
    shops.push({ id: Date.now().toString(), ...shopData, telegramChatId: null });
  }
  writeShops(shops);
  return idx >= 0 ? shops[idx] : shops[shops.length - 1];
}

function updateTelegramChatId(shopNumber, chatId) {
  const shops = readShops();
  const shop = shops.find(
    (s) => s.shopNumber?.toLowerCase() === shopNumber.toLowerCase(),
  );
  if (!shop) return null;
  shop.telegramChatId = chatId;
  writeShops(shops);
  return shop;
}

function getShopsDueTomorrow() {
  const shops = readShops();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  return shops.filter(
    (s) => s.dueDate === tomorrowStr && s.telegramChatId,
  );
}

module.exports = {
  getAll,
  getByShopNumber,
  upsert,
  updateTelegramChatId,
  getShopsDueTomorrow,
};
