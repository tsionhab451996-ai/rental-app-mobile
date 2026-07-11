import { Link, Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { usePayments } from "@/contexts/PaymentContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

const formatCurrency = (value: number) => `ETB ${value.toFixed(2)}`;

const statusColors: Record<string, string> = {
  paid: "#4CAF50",
  unpaid: "#9E9E9E",
  overdue: "#E53935",
  partial: "#FB8C00",
};

const statusOrder: Record<string, number> = {
  overdue: 0,
  unpaid: 1,
  partial: 2,
  paid: 3,
};

type SortKey = "tenantName" | "shopNumber" | "paymentMonth" | "status" | "amountPaid";

export default function PaymentsScreen() {
  const { payments, loading } = usePayments();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("paymentMonth");
  const [sortAsc, setSortAsc] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "tenantName" || key === "shopNumber");
    }
  };

  const filtered = (search.trim()
    ? payments.filter(
        (p) =>
          p.tenantName.toLowerCase().includes(search.toLowerCase()) ||
          p.shopNumber.toLowerCase().includes(search.toLowerCase()) ||
          p.paymentMonth.includes(search),
      )
    : payments
  ).sort((a, b) => {
    let cmp = 0;
    if (sortKey === "tenantName") cmp = a.tenantName.localeCompare(b.tenantName);
    else if (sortKey === "shopNumber") cmp = a.shopNumber.localeCompare(b.shopNumber);
    else if (sortKey === "paymentMonth") cmp = a.paymentMonth.localeCompare(b.paymentMonth);
    else if (sortKey === "status") cmp = (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    else if (sortKey === "amountPaid") cmp = a.amountPaid - b.amountPaid;
    return sortAsc ? cmp : -cmp;
  });

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Payment Management" }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Payment Management" }} />
      <View style={styles.header}>
        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.text,
              borderColor: colors.icon,
              backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
            },
          ]}
          placeholder="Search by tenant, shop, or month..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Link href="/payment-form" asChild>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.addButtonText}>+ Record</ThemedText>
          </Pressable>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={{ opacity: 0.5, textAlign: "center" }}>
              {payments.length === 0
                ? "No payments recorded yet. Tap + Record to add one."
                : "No payments match your search."}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.sortBar}>
            {([
              ["paymentMonth", "Month"],
              ["tenantName", "Tenant"],
              ["status", "Status"],
              ["amountPaid", "Amount"],
            ] as const).map(([key, label]) => (
              <Pressable key={key} onPress={() => toggleSort(key)}>
                <ThemedText
                  style={[
                    styles.sortChip,
                    sortKey === key && { color: colors.tint, fontWeight: "700" },
                  ]}
                >
                  {label}{sortIcon(key)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {filtered.map((payment) => (
          <Link
            key={payment.id}
            href={`/payment-form?id=${payment.id}`}
            asChild
          >
            <Pressable
              style={[
                styles.card,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#1c1c1e" : "#fff",
                  borderColor: colors.icon + "30",
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <ThemedText style={styles.tenantName}>
                    {payment.tenantName}
                  </ThemedText>
                  <ThemedText style={styles.shopText}>
                    Shop {payment.shopNumber} ·{" "}
                    {new Date(payment.paymentMonth + "-01").toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short" },
                    )}
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
              <View style={styles.cardBottom}>
                <View>
                  <ThemedText style={styles.amountLabel}>Paid</ThemedText>
                  <ThemedText style={styles.amountValue}>
                    {formatCurrency(payment.amountPaid)}
                  </ThemedText>
                </View>
                {payment.remainingBalance > 0 && (
                  <View>
                    <ThemedText style={styles.amountLabel}>
                      Balance
                    </ThemedText>
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
              {payment.notes ? (
                <ThemedText style={styles.notesText} numberOfLines={1}>
                  {payment.notes}
                </ThemedText>
              ) : null}
            </Pressable>
          </Link>
        ))}
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
  header: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  addButton: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 10,
  },
  empty: {
    marginTop: 60,
    alignItems: "center",
  },
  sortBar: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  sortChip: {
    fontSize: 13,
    opacity: 0.6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardTop: {
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
  shopText: {
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
  cardBottom: {
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
});
