import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildTelegramReminderMessage,
  getEthiopianRentCycleDueInfo,
} from "@/utils/ethiopianCalendar";

const SENT_REMINDERS_KEY = "@rentalapp/sent_reminders_log";

export type TenantReminderInfo = {
  id: string;
  fullName: string;
  shopNumber: string;
  rentAmount: number;
  dueDate: string;
  telegramUsername: string;
  paid?: boolean;
  leasePeriod?: string;
  property?: string;
};

export type NotificationDaysConfig = {
  sevenDaysBefore: boolean;
  fiveDaysBefore?: boolean;
  threeDaysBefore: boolean;
  oneDayBefore: boolean;
  dueDate: boolean;
  everyDayAfterDue: boolean;
};

/**
 * Sends a text message to a user via Telegram Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string,
): Promise<{ success: boolean; description?: string }> {
  if (!botToken || !botToken.trim()) {
    return { success: false, description: "No bot token configured in Settings." };
  }
  if (!chatId || !chatId.trim()) {
    return { success: false, description: "Tenant has no Telegram username or Chat ID." };
  }

  let cleanChatId = chatId.trim();
  // Ensure username starts with @ if non-numeric
  if (!cleanChatId.startsWith("@") && isNaN(Number(cleanChatId))) {
    cleanChatId = `@${cleanChatId}`;
  }

  const cleanToken = botToken.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${cleanToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: message,
        }),
      },
    );
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

/**
 * Core automated Telegram rent reminder dispatcher:
 * - Checks rent due date (configured for the first week of the Ethiopian month, ending on Day 7).
 * - Automatically dispatches reminder notifications at exactly 7 days, 5 days, and 3 days prior to due date.
 * - Formats message using:
 *   "Hello [Tenant Name], this is a friendly reminder that your rent payment for [Unit Name/Number] is due in [X] days on [Due Date in Ethiopian Calendar]. Please ensure payment is completed on time."
 * - Flags reminders by tenant ID, billing cycle (e.g. 2019_1), and threshold (7d, 5d, 3d) to ensure they are sent once per cycle.
 */
export async function checkAndSendAutomatedTelegramReminders(
  tenants: TenantReminderInfo[],
  botToken: string,
  currentDate: Date = new Date(),
): Promise<number> {
  if (!botToken || !botToken.trim() || !tenants || tenants.length === 0) {
    return 0;
  }

  let sentLog: Record<string, string | boolean> = {};
  try {
    const raw = await AsyncStorage.getItem(SENT_REMINDERS_KEY);
    if (raw) sentLog = JSON.parse(raw);
  } catch {
    sentLog = {};
  }

  const dueInfo = getEthiopianRentCycleDueInfo(currentDate);
  const daysUntilDue = dueInfo.daysUntilDue;

  // Only dispatch at exactly 7 days, 5 days, or 3 days prior
  if (daysUntilDue !== 7 && daysUntilDue !== 5 && daysUntilDue !== 3) {
    return 0;
  }

  let sentCount = 0;

  for (const tenant of tenants) {
    // Skip paid tenants or tenants without Telegram handle
    if (tenant.paid) continue;
    if (!tenant.telegramUsername || !tenant.telegramUsername.trim()) continue;

    // Unique per-cycle threshold tracking key
    const cycleTrackingKey = `tg_remind_${tenant.id}_${dueInfo.cycleKey}_${daysUntilDue}d`;

    // Ensure reminder for this threshold (7, 5, or 3 days) is sent only once per billing cycle
    if (sentLog[cycleTrackingKey]) {
      continue;
    }

    const message = buildTelegramReminderMessage(
      tenant.fullName,
      tenant.shopNumber,
      daysUntilDue,
      dueInfo.ethDueDateFormatted,
    );

    const res = await sendTelegramMessage(
      botToken,
      tenant.telegramUsername,
      message,
    );

    if (res.success) {
      sentLog[cycleTrackingKey] = new Date().toISOString();
      sentCount++;
    }
  }

  if (sentCount > 0) {
    try {
      await AsyncStorage.setItem(SENT_REMINDERS_KEY, JSON.stringify(sentLog));
    } catch {
      // ignore
    }
  }

  return sentCount;
}

/**
 * Legacy compatibility wrapper that forwards to the Ethiopian automated reminder engine
 */
export async function checkAndSendAutoReminders(
  tenants: TenantReminderInfo[],
  botToken: string,
  enabled: boolean,
  _daysConfig?: NotificationDaysConfig,
): Promise<number> {
  if (!enabled) return 0;
  return checkAndSendAutomatedTelegramReminders(tenants, botToken);
}
