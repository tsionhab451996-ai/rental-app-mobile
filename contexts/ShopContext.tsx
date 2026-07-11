import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Shop = {
  id: string;
  shopNumber: string;
  shopName: string;
  floor: string;
  rentPrice: number;
  deposit: number;
  waterFee: number;
  electricityFee: number;
  description: string;
  status: "occupied" | "vacant";
  tenantName: string;
};

type ShopContextType = {
  shops: Shop[];
  loading: boolean;
  addShop: (shop: Omit<Shop, "id">) => Promise<void>;
  updateShop: (id: string, shop: Partial<Shop>) => Promise<void>;
  deleteShop: (id: string) => Promise<void>;
  getShop: (id: string) => Shop | undefined;
};

const ShopContext = createContext<ShopContextType | null>(null);

const STORAGE_KEY = "@rentalapp/shops";

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  useEffect(() => {
    if (!loading) {
      persistShops();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, loading]);

  async function loadShops() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        setShops(JSON.parse(json));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function persistShops() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(shops));
    } catch {
      // ignore
    }
  }

  const addShop = useCallback(async (shop: Omit<Shop, "id">) => {
    const newShop: Shop = { ...shop, id: `${Date.now()}` };
    setShops((prev) => [newShop, ...prev]);
  }, []);

  const updateShop = useCallback(async (id: string, updates: Partial<Shop>) => {
    setShops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  }, []);

  const deleteShop = useCallback(async (id: string) => {
    setShops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getShop = useCallback(
    (id: string) => shops.find((s) => s.id === id),
    [shops],
  );

  return (
    <ShopContext.Provider
      value={{ shops, loading, addShop, updateShop, deleteShop, getShop }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShops() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShops must be used within a ShopProvider");
  }
  return context;
}
