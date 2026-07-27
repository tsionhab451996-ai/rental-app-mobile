import AsyncStorage from "@react-native-async-storage/async-storage";

const SENT_REMINDERS_KEY = "@rentalapp/sent_reminders_log";

export type TenantReminderInfo = {
  id: string;
  fullName: string;
  rentAmount: number;
  dueDate: string;
  telegramUsername: string;
  paid?: boolean;
};

export type NotificationDaysConfig = {
  sevenDaysBefore: boolean;
  threeDaysBefore: boolean;
  oneDayBefore: boolean;
  dueDate: boolean;
  everyDayAfterDue: boolean;
};

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; description?: string }> {
  if (!botToken || !botToken.trim()) {
    return { success: false, description: "No bot token configured in Settings." };
  }
  if (!chatId || !chatId.trim()) {
    return { success: false, description: "Tenant has no Telegram username/Chat ID." };
  }

  const cleanChatId = chatId.trim();
  const cleanToken = botToken.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
    const result = await response.json();
    if (result.ok) {
      return { success: true };
    } else {
      return {
        success: false,
        description: result.description || "Telegram API error",
      };
    }
  } catch (error: any) {
    return { success: false, description: error.message || "Network error" };
  }
}

export function calculateDaysUntilDue(dueDateStr: string): number {
  if (!dueDateStr) return 999;
  const due = new Date(dueDateStr);
  const now = new Date();
  const dueUtc = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueUtc - nowUtc) / (1000 * 60 * 60 * 24));
}

export async function checkAndSendAutoReminders(
  tenants: TenantReminderInfo[],
  botToken: string,
  enabled: boolean,
  daysConfig: NotificationDaysConfig
): Promise<number> {
  if (!enabled || !botToken || !botToken.trim() || tenants.length === 0) {
    return 0;
  }

  let sentLog: Record<string, boolean> = {};
  try {
    const raw = await AsyncStorage.getItem(SENT_REMINDERS_KEY);
    if (raw) sentLog = JSON.parse(raw);
  } catch {
    sentLog = {};
  }

  const todayStr = new Date().toISOString().split("T")[0];
  let sentCount = 0;

  for (const tenant of tenants) {
    if (tenant.paid) continue;
    if (!tenant.telegramUsername || !tenant.telegramUsername.trim()) continue;

    const days = calculateDaysUntilDue(tenant.dueDate);
    let reminderType: string | null = null;

    if (days === 7 && daysConfig.sevenDaysBefore) {
      reminderType = "7_days_before";
    } else if (days === 3 && daysConfig.threeDaysBefore) {
      reminderType = "3_days_before";
    } else if (days === 1 && daysConfig.oneDayBefore) {
      reminderType = "1_day_before";
    } else if (days === 0 && daysConfig.dueDate) {
      reminderType = "due_date";
    } else if (days < 0 && daysConfig.everyDayAfterDue) {
      reminderType = "overdue";
    }

    if (!reminderType) continue;

    const logKey = `${tenant.id}_${reminderType}_${todayStr}`;
    if (sentLog[logKey]) continue;

    const formattedAmount = `ETB ${tenant.rentAmount.toLocaleString()}`;
    const formattedDate = new Date(tenant.dueDate).toLocaleDateString();

    let text = "";
    if (days > 0) {
      text = `⏰ <b>Rent Payment Reminder</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${formattedAmount}</b> is due in <b>${days} day${days === 1 ? "" : "s"}</b> (on ${formattedDate}).\n\nPlease make your payment on time. Thank you!`;
    } else if (days === 0) {
      text = `🔔 <b>Rent Due Today!</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${formattedAmount}</b> is due <b>TODAY (${formattedDate})</b>.\n\nPlease complete your payment today. Thank you!`;
    } else {
      text = `⚠️ <b>Rent Overdue Notice</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${formattedAmount}</b> was due on ${formattedDate} and is currently <b>${Math.abs(days)} day(s) overdue</b>.\n\nPlease settle your payment immediately.`;
    }

    const res = await sendTelegramMessage(botToken, tenant.telegramUsername, text);
    if (res.success) {
      sentLog[logKey] = true;
      sentCount++;
    }
  }

  try {
    await AsyncStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sentLog));
  } catch {
    // ignore
  }

  return sentCount;
}
