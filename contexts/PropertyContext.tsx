import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PropertyName = "Zenebework" | "CMC" | "Ayat";

export interface PropertyInfo {
  name: PropertyName;
  tagline: string;
  location: string;
  totalUnits: number;
  type: string;
  color: string;
}

export const PROPERTIES_DATA: Record<PropertyName, PropertyInfo> = {
  Zenebework: {
    name: "Zenebework",
    tagline: "Commercial Plaza & Retail",
    location: "Kolfe Keranio, Addis Ababa",
    totalUnits: 28,
    type: "Commercial",
    color: "#3B82F6",
  },
  CMC: {
    name: "CMC",
    tagline: "Heights Business Center",
    location: "Yeka Subcity, Addis Ababa",
    totalUnits: 0,
    type: "Mixed Use",
    color: "#10B981",
  },
  Ayat: {
    name: "Ayat",
    tagline: "Grand Mall & Executive Suites",
    location: "Bole Subcity, Addis Ababa",
    totalUnits: 3,
    type: "Retail & Office",
    color: "#8B5CF6",
  },
};

export const PROPERTY_NAMES: PropertyName[] = ["Zenebework", "CMC", "Ayat"];

interface PropertyContextType {
  selectedProperty: PropertyName;
  propertyInfo: PropertyInfo;
  allProperties: PropertyInfo[];
  setSelectedProperty: (property: PropertyName) => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = "@estateflow/selected_property";

const PropertyContext = createContext<PropertyContextType | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedProperty, setSelectedPropertyState] =
    useState<PropertyName>("Zenebework");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedProperty() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (
          saved &&
          (saved === "Zenebework" || saved === "CMC" || saved === "Ayat")
        ) {
          setSelectedPropertyState(saved as PropertyName);
        }
      } catch {
        // use default
      } finally {
        setLoading(false);
      }
    }
    loadSavedProperty();
  }, []);

  const setSelectedProperty = useCallback(async (property: PropertyName) => {
    setSelectedPropertyState(property);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, property);
    } catch {
      // ignore
    }
  }, []);

  const propertyInfo = PROPERTIES_DATA[selectedProperty];
  const allProperties = Object.values(PROPERTIES_DATA);

  return (
    <PropertyContext.Provider
      value={{
        selectedProperty,
        propertyInfo,
        allProperties,
        setSelectedProperty,
        loading,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider");
  }
  return context;
}
