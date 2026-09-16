/**
 * Ethiopian Calendar Utilities (ቀን / ወር / ዓ.ም)
 * Implements Geez/Amharic month cycle (Meskerem through Pagume)
 * Standardizes rent due dates to fall strictly within the first week of every Ethiopian month (Days 1 to 7).
 */

export interface EthiopianMonthInfo {
  order: number;
  am: string;
  en: string;
  days: number;
}

export const ETHIOPIAN_MONTHS: readonly EthiopianMonthInfo[] = [
  { order: 1, am: "መስከረም", en: "Meskerem", days: 30 },
  { order: 2, am: "ጥቅምት", en: "Tikimt", days: 30 },
  { order: 3, am: "ኅዳር", en: "Hidar", days: 30 },
  { order: 4, am: "ታኅሣሥ", en: "Tahsas", days: 30 },
  { order: 5, am: "ጥር", en: "Tir", days: 30 },
  { order: 6, am: "የካቲት", en: "Yekatit", days: 30 },
  { order: 7, am: "መጋቢት", en: "Megabit", days: 30 },
  { order: 8, am: "ሚያዝያ", en: "Miyazya", days: 30 },
  { order: 9, am: "ግንቦት", en: "Ginbot", days: 30 },
  { order: 10, am: "ሰኔ", en: "Sene", days: 30 },
  { order: 11, am: "ሐምሌ", en: "Hamle", days: 30 },
  { order: 12, am: "ነሐሴ", en: "Nehase", days: 30 },
  { order: 13, am: "ጳጉሜ", en: "Pagume", days: 5 }, // 6 in leap year
] as const;

export const ETHIOPIAN_MONTH_NAMES_AM = ETHIOPIAN_MONTHS.map((m) => m.am);
export const ETHIOPIAN_MONTH_NAMES_EN = ETHIOPIAN_MONTHS.map((m) => m.en);

export interface EthiopianDate {
  year: number;
  month: number; // 1 - 13
  day: number; // 1 - 30 (1 - 5/6 for Pagume)
  monthNameAm: string;
  monthNameEn: string;
}

/**
 * Standard conversion from Gregorian Date to Ethiopian Date
 */
export function toEthiopianDate(gregorianDate: Date = new Date()): EthiopianDate {
  const gy = gregorianDate.getFullYear();
  const gm = gregorianDate.getMonth() + 1; // 1-12
  const gd = gregorianDate.getDate();

  // Calculate Julian Day Number from Gregorian Date
  const a = Math.floor((14 - gm) / 12);
  const y = gy + 4800 - a;
  const m = gm + 12 * a - 3;
  const jdn =
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // JDN of Ethiopian Epoch (August 29, 8 CE Julian / August 27, 8 CE Gregorian)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const ethYear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const monthMeta = ETHIOPIAN_MONTHS[ethMonth - 1] || ETHIOPIAN_MONTHS[0];
  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameAm: monthMeta.am,
    monthNameEn: monthMeta.en,
  };
}

/**
 * Rent Due Window Labels:
 * Standardized to Days 1 to 7 of every Ethiopian month.
 */
export const ETHIOPIAN_DUE_WINDOW_FULL = "ቀን 01 - 07 (1st to 7th of every Ethiopian month)";
export const ETHIOPIAN_DUE_WINDOW_SHORT = "ቀን 01 - 07";
export const ETHIOPIAN_DUE_WINDOW_EN = "Days 1 to 7 of every Ethiopian month";

/**
 * Returns formatted payment schedule record for a given date
 * e.g., "Meskerem 1 – Meskerem 7" or "Tikimt 1 – Tikimt 7"
 */
export function getEthiopianPaymentSchedule(
  date: Date = new Date(),
  style: "en" | "am" | "both" = "both",
): string {
  const eth = toEthiopianDate(date);
  if (style === "en") {
    return `${eth.monthNameEn} 1 – ${eth.monthNameEn} 7`;
  }
  if (style === "am") {
    return `${eth.monthNameAm} 1 – ${eth.monthNameAm} 7`;
  }
  return `${eth.monthNameEn} 1 – ${eth.monthNameEn} 7 (${eth.monthNameAm} 1 – 7)`;
}

/**
 * Returns short schedule label e.g., "Meskerem 1 – 7"
 */
export function getEthiopianScheduleShort(date: Date = new Date()): string {
  const eth = toEthiopianDate(date);
  return `${eth.monthNameEn} 1 – 7`;
}

export type RentBadgeStatus = "Paid" | "Pending" | "Overdue";

export interface TenantRentStatusResult {
  status: RentBadgeStatus;
  badgeLabel: string;
  daysRemainingInDueWeek: number;
  ethDate: EthiopianDate;
  isDuePeriod: boolean;
  isOverdue: boolean;
  scheduleEn: string;
  scheduleAm: string;
}

/**
 * Calculates payment status (Paid, Pending, Overdue) relative to current Ethiopian date.
 * - If paid: "Paid"
 * - If unpaid and Ethiopian day is between 1 and 7: "Pending" (within due window)
 * - If unpaid and Ethiopian day is > 7: "Overdue" (past first week deadline)
 */
export function calculateTenantRentStatus(
  paid: boolean,
  currentDate: Date = new Date(),
): TenantRentStatusResult {
  const eth = toEthiopianDate(currentDate);
  const scheduleEn = `${eth.monthNameEn} 1 – ${eth.monthNameEn} 7`;
  const scheduleAm = `${eth.monthNameAm} 1 – ${eth.monthNameAm} 7`;

  if (paid) {
    return {
      status: "Paid",
      badgeLabel: "Paid",
      daysRemainingInDueWeek: 0,
      ethDate: eth,
      isDuePeriod: false,
      isOverdue: false,
      scheduleEn,
      scheduleAm,
    };
  }

  // Unpaid: check relative to Day 7
  if (eth.day <= 7) {
    const daysLeft = 7 - eth.day;
    const badgeLabel =
      daysLeft === 0
        ? "Due Today (Day 7)"
        : `Pending (${daysLeft}d left)`;

    return {
      status: "Pending",
      badgeLabel,
      daysRemainingInDueWeek: daysLeft,
      ethDate: eth,
      isDuePeriod: true,
      isOverdue: false,
      scheduleEn,
      scheduleAm,
    };
  } else {
    const daysOverdue = eth.day - 7;
    return {
      status: "Overdue",
      badgeLabel: `Overdue (${daysOverdue}d)`,
      daysRemainingInDueWeek: 0,
      ethDate: eth,
      isDuePeriod: false,
      isOverdue: true,
      scheduleEn,
      scheduleAm,
    };
  }
}

/**
 * Formats a date in the Ethiopian calendar
 * e.g., "Meskerem 5, 2019 E.C. (መስከረም 5, 2019 ዓ.ም)"
 */
export function formatEthiopianDate(
  date: Date = new Date(),
  style: "en" | "am" | "full" = "full",
): string {
  const { year, day, monthNameAm, monthNameEn } = toEthiopianDate(date);
  if (style === "en") {
    return `${monthNameEn} ${day}, ${year} E.C.`;
  }
  if (style === "am") {
    return `${monthNameAm} ${day}, ${year} ዓ.ም`;
  }
  return `${monthNameEn} ${day}, ${year} E.C. (${monthNameAm} ${day})`;
}

/**
 * Converts an Ethiopian date (year, month, day) back to Gregorian Date
 */
export function ethiopianToGregorian(
  ethYear: number,
  ethMonth: number,
  ethDay: number,
): Date {
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

export interface EthiopianRentCycleDueInfo {
  billingYear: number;
  billingMonth: number;
  dueDay: number; // 7 (end of Ethiopian first week)
  dueDateGregorian: Date;
  daysUntilDue: number;
  ethDueDateFormatted: string; // e.g. "Meskerem 7 (መስከረም 7)"
  ethMonthNameEn: string;
  ethMonthNameAm: string;
  cycleKey: string; // e.g. "2019_1"
}

/**
 * Calculates Ethiopian rent cycle due date information.
 * Standardizes rent due dates to fall strictly within the first week of every Ethiopian month (Days 1 to 7).
 * The final deadline of the cycle is Day 7 of the Ethiopian month.
 */
export function getEthiopianRentCycleDueInfo(
  currentDate: Date = new Date(),
): EthiopianRentCycleDueInfo {
  const eth = toEthiopianDate(currentDate);

  let targetYear = eth.year;
  let targetMonth = eth.month;

  // If in Pagume (month 13) or past Day 7 in any month, target the upcoming monthly cycle's Day 7
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

  // Normalize to UTC midnight for precise calendar day differences
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

  const monthMeta =
    ETHIOPIAN_MONTHS[targetMonth - 1] || ETHIOPIAN_MONTHS[0];
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

/**
 * Builds the standardized Telegram rent reminder message according to the required template:
 * "Hello [Tenant Name], this is a friendly reminder that your rent payment for [Unit Name/Number] is due in [X] days on [Due Date in Ethiopian Calendar]. Please ensure payment is completed on time."
 */
export function buildTelegramReminderMessage(
  tenantName: string,
  unitNumber: string,
  days: number,
  ethDueDateStr: string,
): string {
  const unitLabel =
    unitNumber.toLowerCase().startsWith("unit") ||
    unitNumber.toLowerCase().startsWith("shop")
      ? unitNumber
      : `Unit ${unitNumber}`;

  return `ሰላም ${tenantName}፣ ይህ የ${unitLabel} የኪራይ ክፍያዎ በ${days} ቀናት ውስጥ በ${ethDueDateStr} የሚደርስ መሆኑን የሚያስታውስ ወዳጃዊ መልዕክት ነው። እባክዎ ክፍያዎን በወቅቱ ያጠናቅቁ።`;
}
