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
      if (json) {
        const parsed: Tenant[] = JSON.parse(json);
        setTenants(parsed);
        parsed.forEach((t) => {
          if (!t.paid && !t.notificationId) {
            scheduleReminder(t);
          }
        });
      }
    } catch {
      // ignore
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
      const due = new Date(tenant.dueDate);
      const reminderDate = new Date(due);
      reminderDate.setDate(due.getDate() - 1);
      if (reminderDate <= new Date()) return;

      const seconds = Math.ceil(
        (reminderDate.getTime() - Date.now()) / 1000,
      );
      if (seconds <= 0) return;

      const nid = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rental payment due soon",
          body: `${tenant.fullName}'s payment of ETB ${tenant.rentAmount.toFixed(2)} is due on ${new Date(tenant.dueDate).toLocaleDateString()}.`,
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
    [],
  );

  const updateTenant = useCallback(
    async (id: string, updates: Partial<Tenant>) => {
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const updated = { ...t, ...updates };
          if (!updated.paid && !updated.notificationId) {
            scheduleReminder(updated);
          }
          if (updated.paid && t.notificationId) {
            cancelReminder(t.notificationId);
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

  const togglePaid = useCallback(async (id: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = {
          ...t,
          paid: !t.paid,
          lastPaymentDate: !t.paid ? new Date().toISOString() : null,
        };
        if (!updated.paid) {
          scheduleReminder(updated);
        } else if (t.notificationId) {
          cancelReminder(t.notificationId);
        }
        return updated;
      }),
    );
  }, []);

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
