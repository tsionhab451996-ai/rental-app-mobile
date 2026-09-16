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
  ZENEBEWORK_SHOPS,
  CMC_SHOPS,
  AYAT_SHOPS,
} from "@/constants/zenebeworkData";

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
  status: "occupied" | "vacant" | "facility";
  tenantName: string;
  property?: PropertyName;
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
      const defaultSeeds = [...ZENEBEWORK_SHOPS, ...CMC_SHOPS, ...AYAT_SHOPS];

      if (json) {
        const parsed = JSON.parse(json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep user-created custom shops that aren't seed IDs or pre-populated CMC mock units
          const userCustomShops = parsed.filter(
            (s: Shop) =>
              !s.id.startsWith("zen-") &&
              !s.id.startsWith("cmc-") &&
              !s.id.startsWith("ayt-") &&
              !["cmc-s-1", "cmc-s-2", "cmc-s-3", "1", "2", "3"].includes(s.id) &&
              s.shopName !== "Tech Solutions" &&
              s.shopName !== "Heights Pharmacy" &&
              s.shopName !== "Executive Suite 103",
          );
          // Always ensure the official Zenebework 28 units and isolated property seeds are active
          const merged = [...ZENEBEWORK_SHOPS, ...CMC_SHOPS, ...AYAT_SHOPS, ...userCustomShops];
          setShops(merged);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return;
        }
      }
      setShops(defaultSeeds);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSeeds));
    } catch {
      setShops([...ZENEBEWORK_SHOPS, ...CMC_SHOPS, ...AYAT_SHOPS]);
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
