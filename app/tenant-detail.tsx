import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useTenants } from "@/contexts/TenantContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { sendTelegramMessage, calculateDaysUntilDue } from "@/services/telegramService";

const formatCurrency = (value: number) => `ETB ${value.toFixed(2)}`;
const formatDate = (date: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function TenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTenant, deleteTenant, togglePaid } = useTenants();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const tenant = id ? getTenant(id) : undefined;

  if (!tenant) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Tenant" }} />
        <View style={styles.empty}>
          <ThemedText>Tenant not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const dueIn = Math.ceil(
    (new Date(tenant.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const handleDelete = () => {
    Alert.alert(
      "Remove Tenant",
      `Remove ${tenant.fullName} from shop ${tenant.shopNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await deleteTenant(tenant.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleTogglePaid = async () => {
    await togglePaid(tenant.id);
  };

  const handleSendTelegram = async () => {
    const token = settings.notifications.telegramBotToken;
    if (!token || !token.trim()) {
      Alert.alert(
        "Telegram Bot Required",
        "Please enter your Telegram Bot Token in Settings first."
      );
      return;
    }
    if (!tenant.telegramUsername || !tenant.telegramUsername.trim()) {
      Alert.alert(
        "Missing Telegram ID",
        "Please edit tenant details and set their Telegram Username or Chat ID."
      );
      return;
    }

    const days = calculateDaysUntilDue(tenant.dueDate);
    const amountStr = `ETB ${tenant.rentAmount.toLocaleString()}`;
    const dateStr = formatDate(tenant.dueDate);

    let msg = `⏰ <b>Rent Reminder</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${amountStr}</b> is due on <b>${dateStr}</b>.`;
    if (days < 0) {
      msg = `⚠️ <b>Rent Overdue Notice</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${amountStr}</b> was due on ${dateStr} and is currently <b>${Math.abs(days)} day(s) overdue</b>. Please make your payment.`;
    } else if (days === 0) {
      msg = `🔔 <b>Rent Due Today!</b>\n\nHello <b>${tenant.fullName}</b>,\nYour rental payment of <b>${amountStr}</b> is due <b>TODAY (${dateStr})</b>. Please make your payment.`;
    }

    const res = await sendTelegramMessage(token, tenant.telegramUsername, msg);
    if (res.success) {
      Alert.alert("Success", `Telegram reminder sent successfully to ${tenant.fullName}!`);
    } else {
      Alert.alert(
        "Failed to Send",
        `Could not send Telegram message: ${res.description || "Unknown error"}.\n\nNote: The renter must open your bot on Telegram and press /start first.`
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: tenant.fullName }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: tenant.paid ? "#4CAF50" : "#0a7ea4" },
            ]}
          >
            <ThemedText style={styles.avatarText}>
              {tenant.fullName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.nameText}>
            {tenant.fullName}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: tenant.paid ? "#4CAF50" : dueIn < 0 ? "#E53935" : "#FB8C00",
              },
            ]}
          >
            <ThemedText style={styles.statusBadgeText}>
              {tenant.paid
                ? "Paid"
                : dueIn < 0
                  ? `Overdue by ${Math.abs(dueIn)} days`
                  : `Due in ${dueIn} days`}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Link href={`/tenant-form?id=${tenant.id}`} asChild>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
            >
              <ThemedText style={styles.actionText}>Edit</ThemedText>
            </Pressable>
          </Link>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: tenant.paid ? "#FB8C00" : "#4CAF50" },
            ]}
            onPress={handleTogglePaid}
          >
            <ThemedText style={styles.actionText}>
              {tenant.paid ? "Mark Unpaid" : "Mark Paid"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#0088cc" }]}
            onPress={handleSendTelegram}
          >
            <ThemedText style={styles.actionText}>Telegram</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: "#E53935" }]}
            onPress={handleDelete}
          >
            <ThemedText style={styles.actionText}>Remove</ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Personal Information
          </ThemedText>
          <InfoRow label="Phone" value={tenant.phoneNumber} />
          <InfoRow label="Telegram" value={tenant.telegramUsername || "—"} />
          <InfoRow label="Email" value={tenant.email || "—"} />
          <InfoRow label="National ID" value={tenant.nationalId || "—"} />
          <InfoRow label="Business Type" value={tenant.businessType || "—"} />
          <InfoRow label="Emergency Contact" value={tenant.emergencyContact || "—"} />
          <InfoRow label="Address" value={tenant.address || "—"} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Shop & Rent</ThemedText>
          <InfoRow label="Shop Number" value={tenant.shopNumber} />
          <InfoRow label="Monthly Rent" value={formatCurrency(tenant.rentAmount)} />
          <InfoRow label="Due Date" value={formatDate(tenant.dueDate)} />
          <InfoRow label="Deposit Paid" value={formatCurrency(tenant.depositPaid)} />
          <InfoRow label="Lease Period" value={`${formatDate(tenant.startDate)} — ${formatDate(tenant.endDate)}`} />
        </View>

        {tenant.notes ? (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <ThemedText style={styles.notesText}>{tenant.notes}</ThemedText>
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            Payment History ({tenant.history.length})
          </ThemedText>
          {tenant.history.length === 0 ? (
            <ThemedText style={{ opacity: 0.5 }}>
              No payment records yet.
            </ThemedText>
          ) : (
            tenant.history.map((h) => (
              <View
                key={h.id}
                style={[
                  styles.historyItem,
                  {
                    borderColor: colors.icon + "30",
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#f9f9f9",
                  },
                ]}
              >
                <View style={styles.historyRow}>
                  <ThemedText style={{ fontWeight: "600" }}>
                    {formatDate(h.timestamp)}
                  </ThemedText>
                  <View
                    style={[
                      styles.historyStatus,
                      {
                        backgroundColor:
                          h.status === "confirmed" ? "#4CAF50" : "#FB8C00",
                      },
                    ]}
                  >
                    <ThemedText style={styles.historyStatusText}>
                      {h.status}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    gap: 8,
    paddingTop: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  nameText: {
    textAlign: "center",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1.5,
    textAlign: "right",
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyStatus: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  historyStatusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 11,
    textTransform: "capitalize",
  },
});
