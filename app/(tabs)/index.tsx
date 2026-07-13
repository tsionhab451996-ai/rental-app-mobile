import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { usePayments } from "@/contexts/PaymentContext";
import { useShops } from "@/contexts/ShopContext";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

const DEFAULT_BOT_TOKEN = "8827608355:AAEyPcgE_L6hi2qhjJk6gOcLrz2dTK2jWcM";
const REMINDER_DAYS_BEFORE = 3;

const daysUntilDue = (dueDate: string) => {
  return Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
};

const formatCurrency = (value: number) => `ETB ${value.toLocaleString()}`;

const screenWidth = Dimensions.get("window").width;

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const { shops } = useShops();
  const { tenants } = useTenants();
  const { payments } = usePayments();

  const [notificationsToday, setNotificationsToday] = useState(0);

  const dashboardStats = useMemo(() => {
    const totalShops = shops.length;
    const occupiedShops = shops.filter((s) => s.status === "occupied").length;
    const vacantShops = shops.filter((s) => s.status === "vacant").length;
    const totalTenants = tenants.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    const monthlyPayments = payments.filter(
      (p) => p.paymentMonth === monthStr && p.status === "paid",
    );
    const monthlyIncome = monthlyPayments.reduce(
      (sum, p) => sum + p.amountPaid,
      0,
    );
    const unpaidRent = payments
      .filter((p) => p.status === "unpaid" || p.status === "overdue")
      .reduce((sum, p) => sum + p.remainingBalance, 0);
    const overdueCount = payments.filter((p) => p.status === "overdue").length;
    const totalFines = payments.reduce((sum, p) => sum + p.fine, 0);
    return {
      totalShops,
      occupiedShops,
      vacantShops,
      totalTenants,
      monthlyIncome,
      unpaidRent,
      overduePayments: overdueCount,
      notificationsToday,
      totalFines,
    };
  }, [tenants, notificationsToday, shops, payments]);

  const sendTelegramReminder = async (tenant: {
    fullName: string;
    rentAmount: number;
    dueDate: string;
    telegramUsername: string;
  }) => {
    if (!tenant.telegramUsername.trim()) return;

    const days = daysUntilDue(tenant.dueDate);
    const message = `Hello ${tenant.fullName},\nYour rental payment of ${formatCurrency(tenant.rentAmount)} is due on ${new Date(tenant.dueDate).toLocaleDateString()}. ${
      days < 0
        ? "The payment is overdue now."
        : `It is due in ${days} day${days === 1 ? "" : "s"}.`
    }`;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${DEFAULT_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tenant.telegramUsername,
            text: message,
          }),
        },
      );
      const result = await response.json();
      if (result.ok) {
        setNotificationsToday((n) => n + 1);
      }
    } catch {
      // silent fail for auto-reminders
    }
  };

  useEffect(() => {
    const eligible = tenants.filter(
      (t) =>
        !t.paid &&
        t.telegramUsername.trim() &&
        daysUntilDue(t.dueDate) <= REMINDER_DAYS_BEFORE,
    );
    eligible.forEach((t) => sendTelegramReminder(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants]);

  const isWide = screenWidth > 500;
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <LinearGradient
        colors={isDark ? ["#1E3A5F", "#0F172A"] : ["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerBanner}
      >
        <ThemedText style={styles.greetingText}>{greeting}</ThemedText>
        <ThemedText style={styles.headerTitle}>Dashboard</ThemedText>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <ThemedText style={styles.headerStatValue}>
              {dashboardStats.totalShops}
            </ThemedText>
            <ThemedText style={styles.headerStatLabel}>Shops</ThemedText>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <ThemedText style={styles.headerStatValue}>
              {dashboardStats.totalTenants}
            </ThemedText>
            <ThemedText style={styles.headerStatLabel}>Tenants</ThemedText>
          </View>
          <View style={styles.headerStatDivider} />
          <View style={styles.headerStatItem}>
            <ThemedText style={styles.headerStatValue}>
              {formatCurrency(dashboardStats.monthlyIncome)}
            </ThemedText>
            <ThemedText style={styles.headerStatLabel}>Income</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.statsGrid, isWide && styles.statsGridWide]}>
        <StatCard
          label="Occupied"
          value={dashboardStats.occupiedShops.toString()}
          color="#10B981"
          darkMode={isDark}
        />
        <StatCard
          label="Vacant"
          value={dashboardStats.vacantShops.toString()}
          color="#F59E0B"
          darkMode={isDark}
        />
        <StatCard
          label="Unpaid"
          value={formatCurrency(dashboardStats.unpaidRent)}
          color="#EF4444"
          darkMode={isDark}
        />
        <StatCard
          label="Overdue"
          value={dashboardStats.overduePayments.toString()}
          color="#F97316"
          darkMode={isDark}
        />
      </View>

      <ThemedText style={styles.sectionLabel}>Quick Actions</ThemedText>
      <View style={styles.quickActionsGrid}>
        <Link href="/(tabs)/shops" asChild>
          <QuickAction
            icon="store"
            label="Shops"
            color="#2563EB"
            darkMode={isDark}
          />
        </Link>
        <Link href="/(tabs)/tenants" asChild>
          <QuickAction
            icon="people"
            label="Tenants"
            color="#7C3AED"
            darkMode={isDark}
          />
        </Link>
        <Link href="/(tabs)/payments" asChild>
          <QuickAction
            icon="credit-card"
            label="Payments"
            color="#059669"
            darkMode={isDark}
          />
        </Link>
        <Link href="/approvals" asChild>
          <QuickAction
            icon="check-circle"
            label="Approvals"
            color="#0891B2"
            darkMode={isDark}
          />
        </Link>
      </View>

    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatCard({
  label,
  value,
  color,
  darkMode,
}: {
  label: string;
  value: string;
  color: string;
  darkMode: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: darkMode ? "#1E293B" : "#fff",
          borderLeftColor: color,
        },
      ]}
    >
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  darkMode,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  darkMode: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.quickAction,
        { backgroundColor: darkMode ? "#1E293B" : "#fff", borderColor: darkMode ? "#334155" : "#E2E8F0" },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIconBg, { backgroundColor: color + "18" }]}>
        <ThemedText style={[styles.quickActionIcon, { color }]}>{icon === "store" ? "🏪" : icon === "people" ? "👥" : icon === "credit-card" ? "💳" : icon === "check-circle" ? "✅" : "📨"}</ThemedText>
      </View>
      <ThemedText style={[styles.quickActionLabel, { color: darkMode ? "#F1F5F9" : "#0F172A" }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  headerBanner: {
    paddingTop: 60,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greetingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginBottom: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 20,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  headerStatItem: {
    flex: 1,
    alignItems: "center",
  },
  headerStatValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerStatLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    opacity: 0.4,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  statsGridWide: {
    gap: 12,
  },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },
  quickAction: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionIcon: {
    fontSize: 24,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
