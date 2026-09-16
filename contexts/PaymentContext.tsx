import AsyncStorage from "@react-native-async-storage/async-storage";
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
  ZENEBEWORK_PAYMENTS,
  CMC_PAYMENTS,
  AYAT_PAYMENTS,
} from "@/constants/zenebeworkData";

export type PaymentStatus = "paid" | "unpaid" | "overdue" | "partial";

export type Payment = {
  id: string;
  tenantId: string;
  tenantName: string;
  shopNumber: string;
  monthlyRent: number;
  paymentMonth: string;
  dueDate: string;
  paymentDate: string;
  amountPaid: number;
  remainingBalance: number;
  fine: number;
  notes: string;
  status: PaymentStatus;
  createdAt: string;
  property?: PropertyName;
};

type PaymentContextType = {
  payments: Payment[];
  loading: boolean;
  addPayment: (payment: Omit<Payment, "id" | "createdAt">) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  getPayment: (id: string) => Payment | undefined;
  getPaymentsByTenant: (tenantId: string) => Payment[];
};

const PaymentContext = createContext<PaymentContextType | null>(null);

const STORAGE_KEY = "@rentalapp/payments";

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  useEffect(() => {
    if (!loading) {
      persistPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, loading]);

  async function loadPayments() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const defaultSeeds = [...ZENEBEWORK_PAYMENTS, ...CMC_PAYMENTS, ...AYAT_PAYMENTS];

      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep user-created custom payments that aren't seed IDs or pre-populated CMC mock payments
          const userCustomPayments = parsed.filter(
            (p: Payment) =>
              !p.id.startsWith("zen-pay-") &&
              !p.id.startsWith("cmc-pay-") &&
              !p.id.startsWith("ayt-pay-") &&
              !["cmc-pay-1", "cmc-pay-2", "1", "2", "3"].includes(p.id) &&
              p.tenantName !== "Ermias Bekele" &&
              p.tenantName !== "Dr. Bethlehem Alemu",
          );
          // Always ensure the official Zenebework 22 payments (234,000 ETB) and isolated property seeds are active
          const merged = [...ZENEBEWORK_PAYMENTS, ...CMC_PAYMENTS, ...AYAT_PAYMENTS, ...userCustomPayments];
          setPayments(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }
      setPayments(defaultSeeds);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeeds));
    } catch {
      setPayments([...ZENEBEWORK_PAYMENTS, ...CMC_PAYMENTS, ...AYAT_PAYMENTS]);
    } finally {
      setLoading(false);
    }
  }

  async function persistPayments() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    } catch {
      // ignore
    }
  }

  const addPayment = useCallback(
    async (payment: Omit<Payment, "id" | "createdAt">) => {
      const newPayment: Payment = {
        ...payment,
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setPayments((prev) => [newPayment, ...prev]);
    },
    [],
  );

  const updatePayment = useCallback(
    async (id: string, updates: Partial<Payment>) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    },
    [],
  );

  const deletePayment = useCallback(async (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPayment = useCallback(
    (id: string) => payments.find((p) => p.id === id),
    [payments],
  );

  const getPaymentsByTenant = useCallback(
    (tenantId: string) => payments.filter((p) => p.tenantId === tenantId),
    [payments],
  );

  return (
    <PaymentContext.Provider
      value={{
        payments,
        loading,
        addPayment,
        updatePayment,
        deletePayment,
        getPayment,
        getPaymentsByTenant,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayments must be used within a PaymentProvider");
  }
  return context;
}
