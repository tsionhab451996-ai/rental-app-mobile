import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
      if (json) {
        setPayments(JSON.parse(json));
      }
    } catch {
      // ignore
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
