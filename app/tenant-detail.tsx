import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { usePayments } from "@/contexts/PaymentContext";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  calculateTenantRentStatus,
  getEthiopianPaymentSchedule,
  ETHIOPIAN_DUE_WINDOW_FULL,
} from "@/utils/ethiopianCalendar";

const formatCurrency = (value: number) => `ETB ${value.toLocaleString()}`;
const formatDate = (date: string) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function TenantDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getTenant, deleteTenant, togglePaid } = useTenants();
  const { payments, updatePayment, addPayment } = usePayments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";

  const tenant = id ? getTenant(id) : undefined;

  if (!tenant) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: "Tenant Details" }} />
        <View style={styles.empty}>
          <ThemedText>Tenant not found.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Remove Tenant",
      `Are you sure you want to remove ${tenant.fullName} from unit ${tenant.shopNumber}?`,
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
    const nextPaid = !tenant.paid;
    await togglePaid(tenant.id);

    // Sync corresponding monthly payment record
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    const matchingPayment = payments.find(
      (p) => p.tenantId === tenant.id || (p.shopNumber === tenant.shopNumber && p.property === tenant.property)
    );

    if (matchingPayment) {
      await updatePayment(matchingPayment.id, {
        status: nextPaid ? "paid" : "unpaid",
        amountPaid: nextPaid ? tenant.rentAmount : 0,
        remainingBalance: nextPaid ? 0 : tenant.rentAmount,
        paymentDate: nextPaid ? new Date().toISOString().split("T")[0] : "",
      });
    } else if (nextPaid) {
      await addPayment({
        tenantId: tenant.id,
        tenantName: tenant.fullName,
        shopNumber: tenant.shopNumber,
        monthlyRent: tenant.rentAmount,
        paymentMonth: monthStr,
        dueDate: "ቀን 01 - 07",
        paymentDate: new Date().toISOString().split("T")[0],
        amountPaid: tenant.rentAmount,
        remainingBalance: 0,
        fine: 0,
        notes: `Marked paid by landlord`,
        status: "paid",
        property: tenant.property,
      });
    }
  };

  const handleOpenTelegram = async () => {
    const rawPhone = tenant.phoneNumber?.trim();
    if (!rawPhone || rawPhone === "-") {
      Alert.alert(
        "No Phone Number",
        `No phone number is registered for ${tenant.fullName}. Edit this profile to add a phone number.`
      );
      return;
    }

    // Sanitize phone number to digits only
    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) {
      Alert.alert(
        "Invalid Phone Number",
        `The phone number (${tenant.phoneNumber}) could not be recognized.`
      );
      return;
    }

    // Convert to international format: if starting with 09/07, prepend 251
    let intl = digits;
    if (digits.startsWith("0")) {
      intl = "251" + digits.slice(1);
    } else if (!digits.startsWith("251")) {
      intl = "251" + digits;
    }

    const tgUrl = `https://t.me/+${intl}`;

    try {
      await Linking.openURL(tgUrl);
    } catch {
      Alert.alert(
        "Could Not Open Telegram",
        `Unable to open ${tgUrl}. Please ensure Telegram is installed on your device.`
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0B1220" : colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          title: tenant.fullName,
          headerBackTitle: "Back",
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Avatar & Status Hero */}
        <View style={styles.headerSection}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: tenant.paid
                  ? "#10B981"
                  : isDark
                  ? "#2563EB"
                  : "#3B82F6",
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {tenant.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text
            style={[
              styles.nameText,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            {tenant.fullName}
          </Text>

          {(() => {
            const rentStatus = calculateTenantRentStatus(tenant.paid);
            const badgeBg =
              rentStatus.status === "Paid"
                ? isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5"
                : rentStatus.status === "Pending"
                ? isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB"
                : isDark ? "rgba(239, 68, 68, 0.16)" : "#FEF2F2";
            const badgeBorder =
              rentStatus.status === "Paid"
                ? "#10B981"
                : rentStatus.status === "Pending"
                ? "#F59E0B"
                : "#EF4444";
            const badgeColor =
              rentStatus.status === "Paid"
                ? "#10B981"
                : rentStatus.status === "Pending"
                ? isDark ? "#FBBF24" : "#D97706"
                : isDark ? "#F87171" : "#EF4444";
            const badgeIcon =
              rentStatus.status === "Paid"
                ? "checkmark-circle"
                : rentStatus.status === "Pending"
                ? "time"
                : "alert-circle";

            return (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: badgeBg,
                    borderColor: badgeBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  },
                ]}
              >
                <Ionicons
                  name={badgeIcon}
                  size={13}
                  color={badgeColor}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: badgeColor,
                    },
                  ]}
                >
                  {rentStatus.status}
                </Text>
              </View>
            );
          })()}
        </View>

        {/* Rebuilt Unified Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* 1. Edit Button */}
          <ScalePressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#CBD5E1",
              },
            ]}
            onPress={() => router.push(`/tenant-form?id=${tenant.id}`)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={isDark ? "#F8FAFC" : "#0F172A"}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isDark ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              Edit
            </Text>
          </ScalePressable>

          {/* 2. Mark Paid / Unpaid Button */}
          <ScalePressable
            style={[
              styles.actionBtn,
              tenant.paid
                ? {
                    backgroundColor: isDark
                      ? "rgba(245, 158, 11, 0.16)"
                      : "#FEF3C7",
                    borderColor: isDark
                      ? "rgba(245, 158, 11, 0.4)"
                      : "#FCD34D",
                  }
                : {
                    backgroundColor: isDark
                      ? "rgba(16, 185, 129, 0.16)"
                      : "#D1FAE5",
                    borderColor: isDark
                      ? "rgba(16, 185, 129, 0.4)"
                      : "#6EE7B7",
                  },
            ]}
            onPress={handleTogglePaid}
          >
            <Ionicons
              name={tenant.paid ? "time-outline" : "checkmark-circle-outline"}
              size={18}
              color={
                tenant.paid
                  ? isDark
                    ? "#FBBF24"
                    : "#B45309"
                  : isDark
                  ? "#34D399"
                  : "#065F46"
              }
            />
            <Text
              style={[
                styles.actionBtnText,
                {
                  color: tenant.paid
                    ? isDark
                      ? "#FBBF24"
                      : "#B45309"
                    : isDark
                    ? "#34D399"
                    : "#065F46",
                },
              ]}
            >
              {tenant.paid ? "Unpaid" : "Paid"}
            </Text>
          </ScalePressable>

          {/* 3. Telegram Button (Direct Phone Linking) */}
          <ScalePressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: "#229ED9",
                borderColor: "#1BA0E2",
              },
            ]}
            onPress={handleOpenTelegram}
          >
            <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
            <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
              Telegram
            </Text>
          </ScalePressable>

          {/* 4. Remove Button */}
          <ScalePressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: isDark
                  ? "rgba(239, 68, 68, 0.16)"
                  : "#FEE2E2",
                borderColor: isDark
                  ? "rgba(239, 68, 68, 0.4)"
                  : "#FCA5A5",
              },
            ]}
            onPress={handleDelete}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={isDark ? "#F87171" : "#DC2626"}
            />
            <Text
              style={[
                styles.actionBtnText,
                { color: isDark ? "#F87171" : "#DC2626" },
              ]}
            >
              Remove
            </Text>
          </ScalePressable>
        </View>

        {/* Section: Personal Information */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#131F37" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            Personal Information
          </Text>

          <InfoRow label="Phone" value={tenant.phoneNumber || "-"} isDark={isDark} />

          {/* Only display Telegram / Email if provided */}
          {tenant.telegramUsername ? (
            <InfoRow
              label="Telegram"
              value={tenant.telegramUsername}
              isDark={isDark}
            />
          ) : null}

          {tenant.email ? (
            <InfoRow label="Email" value={tenant.email} isDark={isDark} />
          ) : null}

          <InfoRow
            label="National ID"
            value={tenant.nationalId || "-"}
            isDark={isDark}
          />

          <InfoRow
            label="Business Type"
            value={tenant.businessType || "-"}
            isDark={isDark}
          />

          {tenant.emergencyContact ? (
            <InfoRow
              label="Emergency Contact"
              value={tenant.emergencyContact}
              isDark={isDark}
            />
          ) : null}

          <InfoRow
            label="Address"
            value={tenant.address || "-"}
            isDark={isDark}
          />
        </View>

        {/* Section: Shop & Rent */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#131F37" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            Shop & Rent
          </Text>

          <InfoRow label="Shop / Unit" value={`Unit ${tenant.shopNumber}`} isDark={isDark} />
          <InfoRow
            label="Monthly Rent"
            value={formatCurrency(tenant.rentAmount)}
            isDark={isDark}
          />
          <InfoRow
            label="Payment Status"
            value={calculateTenantRentStatus(tenant.paid).status}
            isDark={isDark}
          />
          <InfoRow
            label="Due Window"
            value={getEthiopianPaymentSchedule(new Date(), "both")}
            isDark={isDark}
          />
          <InfoRow
            label="Contract Deadline"
            value={tenant.endDate ? formatDate(tenant.endDate) : "Not set (Open lease)"}
            isDark={isDark}
          />
          <InfoRow
            label="Deposit Paid"
            value={formatCurrency(tenant.depositPaid)}
            isDark={isDark}
          />
          <InfoRow
            label="Lease Period"
            value={tenant.leasePeriod || "-"}
            isDark={isDark}
          />
        </View>

        {/* Section: Notes (if present) */}
        {tenant.notes ? (
          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              Notes
            </Text>
            <Text
              style={[
                styles.notesText,
                { color: isDark ? "#CBD5E1" : "#334155" },
              ]}
            >
              {tenant.notes}
            </Text>
          </View>
        ) : null}

        {/* Section: Payment History */}
        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: isDark ? "#131F37" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            Payment History ({tenant.history.length})
          </Text>
          {tenant.history.length === 0 ? (
            <Text
              style={[
                styles.emptyHistoryText,
                { color: isDark ? "#64748B" : "#94A3B8" },
              ]}
            >
              No payment records yet.
            </Text>
          ) : (
            tenant.history.map((h) => (
              <View
                key={h.id}
                style={[
                  styles.historyItem,
                  {
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "#E2E8F0",
                    backgroundColor: isDark ? "#0F1B30" : "#F8FAFC",
                  },
                ]}
              >
                <View style={styles.historyRow}>
                  <Text
                    style={{
                      fontWeight: "600",
                      color: isDark ? "#F8FAFC" : "#0F172A",
                    }}
                  >
                    {formatDate(h.timestamp)}
                  </Text>
                  <View
                    style={[
                      styles.historyStatus,
                      {
                        backgroundColor:
                          h.status === "confirmed"
                            ? isDark
                              ? "rgba(16, 185, 129, 0.2)"
                              : "#DCFCE7"
                            : isDark
                            ? "rgba(245, 158, 11, 0.2)"
                            : "#FEF3C7",
                        borderColor:
                          h.status === "confirmed" ? "#10B981" : "#F59E0B",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyStatusText,
                        {
                          color:
                            h.status === "confirmed" ? "#10B981" : "#D97706",
                        },
                      ]}
                    >
                      {h.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          borderBottomColor: isDark
            ? "rgba(255, 255, 255, 0.06)"
            : "rgba(0, 0, 0, 0.06)",
        },
      ]}
    >
      <Text
        style={[
          styles.infoLabel,
          { color: isDark ? "#94A3B8" : "#64748B" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.infoValue,
          { color: isDark ? "#F8FAFC" : "#0F172A" },
        ]}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginVertical: 6,
  },
  actionBtn: {
    flex: 1,
    minHeight: 58,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1.6,
    textAlign: "right",
  },
  notesText: {
    fontSize: 13,
    lineHeight: 20,
  },
  emptyHistoryText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
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
    borderWidth: 1,
  },
  historyStatusText: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "capitalize",
  },
});
