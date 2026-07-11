import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type NotificationSettings = {
  enableTelegram: boolean;
  enableSMS: boolean;
  reminderTime: string;
  reminderDays: {
    sevenDaysBefore: boolean;
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    dueDate: boolean;
    everyDayAfterDue: boolean;
  };
};

export type ProfileSettings = {
  ownerName: string;
  marketplaceName: string;
  phone: string;
  email: string;
};

export type SecuritySettings = {
  pinEnabled: boolean;
  pin: string;
  fingerprintEnabled: boolean;
};

export type AppearanceSettings = {
  darkMode: boolean | null;
  language: string;
};

export type Settings = {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
};

type SettingsContextType = {
  settings: Settings;
  loading: boolean;
  updateProfile: (updates: Partial<ProfileSettings>) => Promise<void>;
  updateNotifications: (updates: Partial<NotificationSettings>) => Promise<void>;
  updateNotificationDays: (updates: Partial<NotificationSettings["reminderDays"]>) => Promise<void>;
  updateSecurity: (updates: Partial<SecuritySettings>) => Promise<void>;
  updateAppearance: (updates: Partial<AppearanceSettings>) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  verifyPin: (pin: string) => boolean;
};

const STORAGE_KEY = "@rentalapp/settings";

const defaultSettings: Settings = {
  profile: {
    ownerName: "",
    marketplaceName: "",
    phone: "",
    email: "",
  },
  notifications: {
    enableTelegram: false,
    enableSMS: false,
    reminderTime: "09:00",
    reminderDays: {
      sevenDaysBefore: false,
      threeDaysBefore: true,
      oneDayBefore: true,
      dueDate: true,
      everyDayAfterDue: false,
    },
  },
  security: {
    pinEnabled: false,
    pin: "",
    fingerprintEnabled: false,
  },
  appearance: {
    darkMode: null,
    language: "English",
  },
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!loading) {
      persistSettings();
    }
  }, [settings, loading]);

  async function loadSettings() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const parsed = JSON.parse(json);
        setSettings((prev) => ({
          ...prev,
          ...parsed,
          profile: { ...prev.profile, ...parsed.profile },
          security: { ...prev.security, ...parsed.security },
          appearance: { ...prev.appearance, ...parsed.appearance },
          notifications: {
            ...prev.notifications,
            ...parsed.notifications,
            reminderDays: {
              ...prev.notifications.reminderDays,
              ...(parsed.notifications?.reminderDays ?? {}),
            },
          },
        }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function persistSettings() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  const updateProfile = useCallback(async (updates: Partial<ProfileSettings>) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updates },
    }));
  }, []);

  const updateNotifications = useCallback(async (updates: Partial<NotificationSettings>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...updates },
    }));
  }, []);

  const updateNotificationDays = useCallback(async (updates: Partial<NotificationSettings["reminderDays"]>) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        reminderDays: { ...prev.notifications.reminderDays, ...updates },
      },
    }));
  }, []);

  const updateSecurity = useCallback(async (updates: Partial<SecuritySettings>) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, ...updates },
    }));
  }, []);

  const updateAppearance = useCallback(async (updates: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...updates },
    }));
  }, []);

  const setPin = useCallback(async (pin: string) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, pinEnabled: true, pin },
    }));
  }, []);

  const removePin = useCallback(async () => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, pinEnabled: false, pin: "" },
    }));
  }, []);

  const verifyPin = useCallback((pin: string): boolean => {
    return settings.security.pin === pin;
  }, [settings.security.pin]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateProfile,
        updateNotifications,
        updateNotificationDays,
        updateSecurity,
        updateAppearance,
        setPin,
        removePin,
        verifyPin,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
