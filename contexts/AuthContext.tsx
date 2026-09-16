import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type User = {
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  rememberedEmail: string | null;
  login: (emailOrUsername: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  forgotPassword: (emailOrUsername: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  user: "auth_user",
  credentials: "auth_credentials",
  rememberedEmail: "auth_remembered_email",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      if (!isNavigating.current) {
        isNavigating.current = true;
        router.replace("/(auth)/login");
        setTimeout(() => { isNavigating.current = false; }, 500);
      }
    } else if (user && inAuthGroup) {
      if (!isNavigating.current) {
        isNavigating.current = true;
        router.replace("/property-select");
        setTimeout(() => { isNavigating.current = false; }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, segments]);

  async function loadStoredData() {
    try {
      const [userJson, remembered, credsJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.user),
        AsyncStorage.getItem(STORAGE_KEYS.rememberedEmail),
        AsyncStorage.getItem(STORAGE_KEYS.credentials),
      ]);
      if (!credsJson) {
        // Initialize default owner credentials for first-time use
        const defaultOwner = [{ email: "owner@rentalapp.com", username: "owner", password: "admin123" }];
        await AsyncStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(defaultOwner));
      }
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
      if (remembered) {
        setRememberedEmail(remembered);
      }
    } catch {
      // ignore storage errors
    } finally {
      setLoading(false);
    }
  }

  const login = useCallback(
    async function login(
      emailOrUsername: string,
      password: string,
      rememberMe: boolean
    ) {
      const cleanInput = emailOrUsername.trim().toLowerCase();
      const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
      const credentials = credentialsJson ? JSON.parse(credentialsJson) : [];
      const match = credentials.find(
        (c: { email: string; username: string; password: string }) =>
          (c.email.toLowerCase() === cleanInput || c.username.toLowerCase() === cleanInput) &&
          c.password === password
      );
      if (!match) {
        throw new Error("Invalid email/username or password.");
      }
      const loggedInUser: User = { email: match.email, username: match.username };
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(loggedInUser));
      if (rememberMe) {
        await AsyncStorage.setItem(STORAGE_KEYS.rememberedEmail, emailOrUsername.trim());
        setRememberedEmail(emailOrUsername.trim());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.rememberedEmail);
        setRememberedEmail(null);
      }
      setUser(loggedInUser);
    },
    [],
  );

  const register = useCallback(
    async function register(email: string, username: string, password: string) {
      const cleanEmail = email.trim();
      const cleanUsername = username.trim();
      const existingJson = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
      const existing = existingJson ? JSON.parse(existingJson) : [];

      const duplicate = existing.find(
        (c: { email: string; username: string }) =>
          c.email.toLowerCase() === cleanEmail.toLowerCase() ||
          c.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (duplicate) {
        throw new Error("An account with this email or username already exists.");
      }

      const newUser = { email: cleanEmail, username: cleanUsername, password };
      existing.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(existing));

      const loggedInUser: User = { email: cleanEmail, username: cleanUsername };
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    },
    [],
  );

  async function forgotPassword(emailOrUsername: string) {
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
    if (!credentialsJson) {
      throw new Error("No account found with that email/username.");
    }
    const credentials = JSON.parse(credentialsJson);
    const account = credentials.find(
      (c: { email: string; username: string }) =>
        c.email === emailOrUsername || c.username === emailOrUsername
    );
    if (!account) {
      throw new Error("No account found with that email/username.");
    }
    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase();
    await AsyncStorage.setItem("auth_reset_token", JSON.stringify({ token: resetToken, email: account.email }));
  }

  async function resetPassword(token: string, newPassword: string) {
    const resetJson = await AsyncStorage.getItem("auth_reset_token");
    if (!resetJson) {
      throw new Error("No reset request found. Please request a password reset first.");
    }
    const resetData = JSON.parse(resetJson);
    if (resetData.token !== token) {
      throw new Error("Invalid reset token.");
    }
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
    const credentials = JSON.parse(credentialsJson ?? "[]");
    const index = credentials.findIndex(
      (c: { email: string }) => c.email === resetData.email
    );
    if (index === -1) {
      throw new Error("Account not found.");
    }
    credentials[index].password = newPassword;
    await AsyncStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(credentials));
    await AsyncStorage.removeItem("auth_reset_token");
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    const credentialsJson = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
    if (!credentialsJson) {
      throw new Error("No account found.");
    }
    const credentials = JSON.parse(credentialsJson);
    const index = credentials.findIndex(
      (c: { email: string; password: string }) =>
        c.email === user?.email && c.password === currentPassword
    );
    if (index === -1) {
      throw new Error("Current password is incorrect.");
    }
    credentials[index].password = newPassword;
    await AsyncStorage.setItem(STORAGE_KEYS.credentials, JSON.stringify(credentials));
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEYS.user);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        rememberedEmail,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
