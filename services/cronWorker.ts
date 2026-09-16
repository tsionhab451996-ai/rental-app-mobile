import { AppState, type AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  checkAndSendAutomatedTelegramReminders,
  type TenantReminderInfo,
} from "./telegramService";
import { getEthiopianRentCycleDueInfo } from "@/utils/ethiopianCalendar";

const SETTINGS_STORAGE_KEY = "@rentalapp/settings";
const TENANTS_STORAGE_KEY = "@rentalapp/tenants";
const CRON_STATUS_STORAGE_KEY = "@rentalapp/cron_worker_status";

// Hourly background interval (1 hour in milliseconds)
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: { remove: () => void } | null = null;
let isRunning = false;
let isChecking = false;

export type CronWorkerStatus = {
  lastRunTime: string | null;
  lastSentCount: number;
  lastStatusMessage: string;
  nextScheduledCheck: string | null;
  daysUntilDue: number;
  ethDueDateFormatted: string;
};

/**
 * Runs the automated Telegram due date reminder check.
 * Checks active tenants against the 7-day, 5-day, and 3-day thresholds before their Ethiopian rent due date.
 */
export async function runScheduledRemindersCheck(
  referenceDate: Date = new Date(),
): Promise<{
  success: boolean;
  sentCount: number;
  message: string;
  daysUntilDue: number;
}> {
  if (isChecking) {
    return {
      success: false,
      sentCount: 0,
      message: "Check already in progress.",
      daysUntilDue: 0,
    };
  }

  isChecking = true;
  try {
    const dueInfo = getEthiopianRentCycleDueInfo(referenceDate);

    // Read configured settings
    const rawSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = rawSettings ? JSON.parse(rawSettings) : null;

    const token = settings?.notifications?.telegramBotToken?.trim() || "";
    const isTelegramEnabled = settings?.notifications?.enableTelegram ?? true;

    if (!isTelegramEnabled) {
      const msg = "Telegram reminders are disabled in Settings.";
      await updateWorkerStatus(msg, 0, dueInfo.daysUntilDue, dueInfo.ethDueDateFormatted);
      return { success: false, sentCount: 0, message: msg, daysUntilDue: dueInfo.daysUntilDue };
    }

    if (!token) {
      const msg = "Telegram Bot Token not configured in Settings.";
      await updateWorkerStatus(msg, 0, dueInfo.daysUntilDue, dueInfo.ethDueDateFormatted);
      return { success: false, sentCount: 0, message: msg, daysUntilDue: dueInfo.daysUntilDue };
    }

    // Read stored tenants
    const rawTenants = await AsyncStorage.getItem(TENANTS_STORAGE_KEY);
    const tenantsList: any[] = rawTenants ? JSON.parse(rawTenants) : [];

    if (!Array.isArray(tenantsList) || tenantsList.length === 0) {
      const msg = "No tenants found in local storage.";
      await updateWorkerStatus(msg, 0, dueInfo.daysUntilDue, dueInfo.ethDueDateFormatted);
      return { success: true, sentCount: 0, message: msg, daysUntilDue: dueInfo.daysUntilDue };
    }

    const tenantInfoList: TenantReminderInfo[] = tenantsList.map((t) => ({
      id: String(t.id),
      fullName: t.fullName || "Tenant",
      shopNumber: t.shopNumber || t.unitNumber || "Shop",
      rentAmount: Number(t.rentAmount) || 0,
      dueDate: t.dueDate || "ቀን 01 - 07",
      telegramUsername: t.telegramUsername || "",
      paid: Boolean(t.paid),
      leasePeriod: t.leasePeriod || "",
      property: t.property,
    }));

    const sentCount = await checkAndSendAutomatedTelegramReminders(
      tenantInfoList,
      token,
      referenceDate,
    );

    let statusMsg = "";
    if (dueInfo.daysUntilDue === 7 || dueInfo.daysUntilDue === 5 || dueInfo.daysUntilDue === 3) {
      statusMsg = `Threshold reached (${dueInfo.daysUntilDue} days prior to ${dueInfo.ethDueDateFormatted}). Dispatched ${sentCount} reminders.`;
    } else {
      statusMsg = `Rent is due in ${dueInfo.daysUntilDue} days on ${dueInfo.ethDueDateFormatted}. Reminders trigger at 7, 5, or 3 days.`;
    }

    await updateWorkerStatus(statusMsg, sentCount, dueInfo.daysUntilDue, dueInfo.ethDueDateFormatted);
    return {
      success: true,
      sentCount,
      message: statusMsg,
      daysUntilDue: dueInfo.daysUntilDue,
    };
  } catch (error: any) {
    const errorMsg = `Error running reminder check: ${error?.message || error}`;
    console.error("[CronWorker]", errorMsg);
    return { success: false, sentCount: 0, message: errorMsg, daysUntilDue: 0 };
  } finally {
    isChecking = false;
  }
}

async function updateWorkerStatus(
  message: string,
  sentCount: number,
  daysUntilDue: number,
  ethDueDateFormatted: string,
) {
  try {
    const status: CronWorkerStatus = {
      lastRunTime: new Date().toISOString(),
      lastSentCount: sentCount,
      lastStatusMessage: message,
      nextScheduledCheck: new Date(Date.now() + CHECK_INTERVAL_MS).toISOString(),
      daysUntilDue,
      ethDueDateFormatted,
    };
    await AsyncStorage.setItem(CRON_STATUS_STORAGE_KEY, JSON.stringify(status));
  } catch {
    // ignore
  }
}

export async function getCronWorkerStatus(): Promise<CronWorkerStatus | null> {
  try {
    const raw = await AsyncStorage.getItem(CRON_STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Starts the automated Telegram reminder cron worker:
 * - Runs once upon startup (after 2s delay)
 * - Runs whenever the application returns to active/foreground
 * - Runs on a continuous periodic interval (every 1 hour)
 */
export function startReminderCronWorker() {
  if (isRunning) return;
  isRunning = true;

  // 1. Initial check after 2s delay to allow storage hydration
  setTimeout(() => {
    runScheduledRemindersCheck().catch(() => {});
  }, 2000);

  // 2. Periodic background interval
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    runScheduledRemindersCheck().catch(() => {});
  }, CHECK_INTERVAL_MS);

  // 3. AppState listener: run check when user opens or resumes app
  if (!appStateSubscription) {
    let lastState: AppStateStatus = AppState.currentState;
    appStateSubscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (lastState.match(/inactive|background/) && nextState === "active") {
          runScheduledRemindersCheck().catch(() => {});
        }
        lastState = nextState;
      },
    );
  }

  console.log("[CronWorker] Automated Telegram reminder worker started.");
}

/**
 * Stops the automated reminder cron worker
 */
export function stopReminderCronWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  isRunning = false;
  console.log("[CronWorker] Automated Telegram reminder worker stopped.");
}
