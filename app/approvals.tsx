import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { usePayments } from "@/contexts/PaymentContext";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  calculateTenantRentStatus,
  getEthiopianPaymentSchedule,
} from "@/utils/ethiopianCalendar";

const formatCurrency = (value: number) => `ETB ${value.toFixed(2)}`;

const statusColors: Record<string, string> = {
  paid: "#4CAF50",
  unpaid: "#9E9E9E",
  overdue: "#E53935",
  partial: "#FB8C00",
};

export default function ApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const { payments, updatePayment, loading: paymentsLoading } = usePayments();
  const { updateTenant, tenants, loading: tenantsLoading } = useTenants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const isDark = colorScheme === "dark";
  const [refreshing, setRefreshing] = useState(false);

  const loading = paymentsLoading || tenantsLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const pendingPayments = payments.filter(
    (p) => p.status === "unpaid" || p.status === "overdue" || p.status === "partial",
  );

  const handleApprove = (paymentId: string, tenantName: string) => {
    Alert.alert(
      "Confirm Payment",
      `Are you sure you verified the payment for ${tenantName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Approve",
          onPress: async () => {
            const payment = payments.find((p) => p.id === paymentId);
            if (!payment) return;

            await updatePayment(paymentId, {
              status: "paid",
              paymentDate: new Date().toISOString().split("T")[0],
              remainingBalance: 0,
            });

            const tenant = tenants.find((t) => t.id === payment.tenantId);
            if (tenant) {
              await updateTenant(tenant.id, {
                paid: true,
                lastPaymentDate: new Date().toISOString(),
              });
            }

            Alert.alert("Success", `${tenantName}'s payment has been approved.`);
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Approvals" }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Approvals" }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <ThemedText type="title" style={styles.pageTitle}>
          Pending Approvals
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Review and confirm incoming rent payments from tenants
        </ThemedText>

        {pendingPayments.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={{ fontSize: 48 }}>🎉</ThemedText>
            <ThemedText style={{ opacity: 0.5, textAlign: "center", marginTop: 12 }}>
              All caught up! No pending payments to verify.
            </ThemedText>
          </View>
        ) : (
          pendingPayments.map((payment) => {
            const ethStatus = calculateTenantRentStatus(payment.status === "paid", new Date());
            const dueDisplay =
              payment.dueDate &&
              !payment.dueDate.includes("ቀን") &&
              !isNaN(new Date(payment.dueDate).getTime())
                ? new Date(payment.dueDate).toLocaleDateString()
                : getEthiopianPaymentSchedule(new Date(), "both");
            const overdueLabel = ethStatus.isOverdue
              ? ` (${ethStatus.ethDate.day - 7} days overdue)`
              : "";

            return (
              <View
                key={payment.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? "#151F32" : "#fff",
                    borderColor: isDark ? "#23324D" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <ThemedText style={styles.tenantName}>
                      {payment.tenantName}
                    </ThemedText>
                    <ThemedText style={styles.metaText}>
                      Shop {payment.shopNumber} · {payment.paymentMonth}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColors[payment.status] },
                    ]}
                  >
                    <ThemedText style={styles.statusText}>
                      {payment.status}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.amountRow}>
                  <View>
                    <ThemedText style={styles.amountLabel}>Expected</ThemedText>
                    <ThemedText style={styles.amountValue}>
                      {formatCurrency(payment.monthlyRent)}
                    </ThemedText>
                  </View>
                  <View>
                    <ThemedText style={styles.amountLabel}>Paid</ThemedText>
                    <ThemedText style={styles.amountValue}>
                      {formatCurrency(payment.amountPaid)}
                    </ThemedText>
                  </View>
                  {payment.remainingBalance > 0 && (
                    <View>
                      <ThemedText style={styles.amountLabel}>Balance</ThemedText>
                      <ThemedText
                        style={[styles.amountValue, { color: "#E53935" }]}
                      >
                        {formatCurrency(payment.remainingBalance)}
                      </ThemedText>
                    </View>
                  )}
                  {payment.fine > 0 && (
                    <View>
                      <ThemedText style={styles.amountLabel}>Fine</ThemedText>
                      <ThemedText
                        style={[styles.amountValue, { color: "#FF5722" }]}
                      >
                        {formatCurrency(payment.fine)}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <ThemedText style={styles.metaText}>
                  Due: {dueDisplay}
                  {overdueLabel}
                </ThemedText>

                {payment.notes ? (
                  <ThemedText style={styles.notesText} numberOfLines={2}>
                    {payment.notes}
                  </ThemedText>
                ) : null}

                <ScalePressable
                  style={[styles.approveButton, { backgroundColor: "#10B981" }]}
                  onPress={() => handleApprove(payment.id, payment.tenantName)}
                >
                  <ThemedText style={styles.approveButtonText}>
                    Approve Payment
                  </ThemedText>
                </ScalePressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.5,
    marginBottom: 20,
  },
  empty: {
    marginTop: 80,
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  tenantName: {
    fontSize: 17,
    fontWeight: "600",
  },
  metaText: {
    fontSize: 13,
    opacity: 0.6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "capitalize",
  },
  amountRow: {
    flexDirection: "row",
    gap: 20,
  },
  amountLabel: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  notesText: {
    fontSize: 13,
    opacity: 0.6,
  },
  approveButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
