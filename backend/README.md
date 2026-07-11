# RentalApp Telegram Bot Backend

## Setup

1. Install dependencies:
   ```
   cd backend
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```
   BOT_TOKEN=your_bot_token_from_botfather
   BASE_URL=https://your-ngrok-url.ngrok.io
   PORT=3000
   ```

3. Start the server:
   ```
   npm start
   ```

4. For local development, expose your server with ngrok:
   ```
   ngrok http 3000
   ```
   Copy the ngrok URL to `BASE_URL` in `.env`, then restart.

5. Set the webhook (or the server does this automatically on start):
   ```
   npm run set-webhook
   ```

## React Native App Connection

Send shop data from your app to the backend whenever a shop is created/updated:

```js
// api/backend.js - Add this to your React Native app
const API_BASE = "https://your-server.com/api";

export async function syncShop(shop) {
  const response = await fetch(`${API_BASE}/shops`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shopNumber: shop.shopNumber,
      rentAmount: shop.rentAmount || shop.rentPrice,
      dueDate: shop.dueDate || "",
      shopName: shop.shopName || "",
      floor: shop.floor || "",
    }),
  });
  return response.json();
}

export async function getAllShops() {
  const response = await fetch(`${API_BASE}/shops`);
  return response.json();
}
```

Call `syncShop()` in your React app after creating or editing a shop:
```js
import { syncShop } from "../api/backend";

// After saving a shop:
await syncShop({
  shopNumber: "A101",
  rentAmount: 3500,
  dueDate: "2026-07-10",
  shopName: "Corner Store",
  floor: "Ground",
});
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/telegram/webhook` | Telegram bot webhook (called by Telegram) |
| GET | `/api/shops` | Get all shops |
| GET | `/api/shops/:shopNumber` | Get shop by number |
| POST | `/api/shops` | Create or update a shop |

## How the Bot Works

1. Owner creates shops in the React Native app and calls `syncShop()`.
2. Owner gives tenants the bot link: `t.me/YourBotUsername`.
3. Tenant presses Start → Bot asks for shop number.
4. Tenant replies with shop number → Bot links the chat to that shop.
5. Every day at 8:00 AM, the bot checks for shops with due dates tomorrow and sends reminders.
