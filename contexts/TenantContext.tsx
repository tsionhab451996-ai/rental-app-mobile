import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PropertyName } from "./PropertyContext";
import {
  ZENEBEWORK_TENANTS,
  CMC_TENANTS,
  AYAT_TENANTS,
} from "@/constants/zenebeworkData";
import {
  getEthiopianPaymentSchedule,
  toEthiopianDate,
} from "@/utils/ethiopianCalendar";
import {
  startReminderCronWorker,
  stopReminderCronWorker,
} from "@/services/cronWorker";

export type PaymentHistory = {
  id: string;
  timestamp: string;
  imageUri: string;
  status: "pending" | "confirmed";
  sender?: "renter" | "owner";
};

export type Tenant = {
  id: string;
  fullName: string;
  phoneNumber: string;
  telegramUsername: string;
  email: string;
  nationalId: string;
  businessType: string;
  shopNumber: string;
  startDate: string;
  endDate: string;
  leasePeriod?: string;
  depositPaid: number;
  emergencyContact: string;
  address: string;
  notes: string;
  rentAmount: number;
  dueDate: string;
  paid: boolean;
  lastPaymentDate: string | null;
  notificationId: string | null;
  history: PaymentHistory[];
  property?: PropertyName;
};

type TenantContextType = {
  tenants: Tenant[];
  loading: boolean;
  addTenant: (tenant: Omit<Tenant, "id">) => Promise<void>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  getTenant: (id: string) => Tenant | undefined;
  togglePaid: (id: string) => Promise<void>;
};

const TenantContext = createContext<TenantContextType | null>(null);

const STORAGE_KEY = "@rentalapp/tenants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
    startReminderCronWorker();
    return () => {
      stopReminderCronWorker();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) {
      persistTenants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants, loading]);

  async function loadTenants() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const defaultSeeds = [...ZENEBEWORK_TENANTS, ...CMC_TENANTS, ...AYAT_TENANTS];

      if (json) {
        const parsed: Tenant[] = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep user-created custom tenants that aren't seed IDs or pre-populated CMC mock tenants
          const userCustomTenants = parsed.filter(
            (t) =>
              !t.id.startsWith("zen-t-") &&
              !t.id.startsWith("cmc-t-") &&
              !t.id.startsWith("ayt-t-") &&
              !["cmc-t-1", "cmc-t-2", "1", "2", "3"].includes(t.id) &&
              t.fullName !== "Ermias Bekele" &&
              t.fullName !== "Dr. Bethlehem Alemu",
          );
          // Always ensure the official Zenebework 22 active tenants and isolated property seeds are active
          const merged = [...ZENEBEWORK_TENANTS, ...CMC_TENANTS, ...AYAT_TENANTS, ...userCustomTenants];
          setTenants(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }
      setTenants(defaultSeeds);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeeds));
    } catch {
      setTenants([...ZENEBEWORK_TENANTS, ...CMC_TENANTS, ...AYAT_TENANTS]);
    } finally {
      setLoading(false);
    }
  }

  async function persistTenants() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tenants));
    } catch {
      // ignore
    }
  }

  async function scheduleReminder(tenant: Tenant) {
    try {
      const isEth = !tenant.dueDate || tenant.dueDate.includes("ቀን");
      let seconds = 0;
      let body = "";

      if (isEth) {
        const eth = toEthiopianDate(new Date());
        const scheduleStr = getEthiopianPaymentSchedule(new Date(), "both");
        if (eth.day <= 7) {
          const daysLeft = Math.max(1, 7 - eth.day);
          seconds = daysLeft * 24 * 3600;
          body = `${tenant.fullName}'s rent of ETB ${tenant.rentAmount.toLocaleString()} is due within ${scheduleStr} (Deadline: ቀን 07).`;
        } else {
          body = `${tenant.fullName}'s rent of ETB ${tenant.rentAmount.toLocaleString()} is overdue for ${scheduleStr}.`;
          seconds = 3600;
        }
      } else {
        const due = new Date(tenant.dueDate);
        if (isNaN(due.getTime())) return;
        const reminderDate = new Date(due);
        reminderDate.setDate(due.getDate() - 1);
        if (reminderDate <= new Date()) return;
        seconds = Math.ceil((reminderDate.getTime() - Date.now()) / 1000);
        if (seconds <= 0) return;
        body = `${tenant.fullName}'s payment of ETB ${tenant.rentAmount.toLocaleString()} is due on ${due.toLocaleDateString()}.`;
      }

      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rental Payment Due Soon",
          body,
        },
        trigger: { seconds, repeats: false } as any,
      });

      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenant.id ? { ...t, notificationId: nid } : t,
        ),
      );
    } catch {
      // ignore
    }
  }

  async function cancelReminder(notificationId: string | null) {
    if (!notificationId) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // ignore
    }
  }

  const addTenant = useCallback(
    async (tenant: Omit<Tenant, "id">) => {
      const newTenant: Tenant = { ...tenant, id: `${Date.now()}` };
      setTenants((prev) => [newTenant, ...prev]);
      if (!newTenant.paid) {
        scheduleReminder(newTenant);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const updateTenant = useCallback(
    async (id: string, updates: Partial<Tenant>) => {
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          if (updated.paid && t.notificationId) {
            cancelReminder(t.notificationId);
            updated.notificationId = null;
          }
          return updated;
        }),
      );
    },
    [],
  );

  const deleteTenant = useCallback(async (id: string) => {
    setTenants((prev) => {
      const target = prev.find((t) => t.id === id);
      if (target?.notificationId) {
        cancelReminder(target.notificationId);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const getTenant = useCallback(
    (id: string) => tenants.find((t) => t.id === id),
    [tenants],
  );

  const togglePaid = useCallback(
    async (id: string) => {
      const target = tenants.find((t) => t.id === id);
      if (!target) return;
      const nextPaid = !target.paid;
      const now = new Date().toISOString();
      const updatedHistory: PaymentHistory[] = nextPaid
        ? [
            {
              id: `hist-${Date.now()}`,
              timestamp: now,
              imageUri: "",
              status: "confirmed",
              sender: "owner",
            },
            ...target.history,
          ]
        : target.history.filter((h) => h.status !== "confirmed");

      await updateTenant(id, {
        paid: nextPaid,
        lastPaymentDate: nextPaid ? now.split("T")[0] : null,
        history: updatedHistory,
      });
    },
    [tenants, updateTenant],
  );

  return (
    <TenantContext.Provider
      value={{
        tenants,
        loading,
        addTenant,
        updateTenant,
        deleteTenant,
        getTenant,
        togglePaid,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenants() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenants must be used within a TenantProvider");
  }
  return context;
}
