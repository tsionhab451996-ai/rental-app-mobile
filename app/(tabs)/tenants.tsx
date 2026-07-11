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
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

const daysUntilDue = (dueDate: string) => {
  return Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
};

const formatCurrency = (value: number) => `ETB ${value.toFixed(2)}`;

type SortKey = "fullName" | "shopNumber" | "rentAmount" | "status";

export default function TenantsScreen() {
  const { tenants, loading } = useTenants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortAsc, setSortAsc] = useState(true);

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
      setSortAsc(true);
    }
  };

  const filtered = (search.trim()
    ? tenants.filter(
        (t) =>
          t.fullName.toLowerCase().includes(search.toLowerCase()) ||
          t.shopNumber.toLowerCase().includes(search.toLowerCase()) ||
          t.phoneNumber.includes(search),
      )
    : tenants
  ).sort((a, b) => {
    let cmp = 0;
    if (sortKey === "fullName") cmp = a.fullName.localeCompare(b.fullName);
    else if (sortKey === "shopNumber") cmp = a.shopNumber.localeCompare(b.shopNumber);
    else if (sortKey === "rentAmount") cmp = a.rentAmount - b.rentAmount;
    else if (sortKey === "status") {
      const aPaid = a.paid ? 0 : daysUntilDue(a.dueDate) < 0 ? 1 : 2;
      const bPaid = b.paid ? 0 : daysUntilDue(b.dueDate) < 0 ? 1 : 2;
      cmp = aPaid - bPaid;
    }
    return sortAsc ? cmp : -cmp;
  });

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Tenant Management" }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Tenant Management" }} />
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
          placeholder="Search by name, shop, or phone..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Link href="/tenant-form" asChild>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText style={styles.addButtonText}>+ Add</ThemedText>
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
              {tenants.length === 0
                ? "No tenants yet. Tap + Add to get started."
                : "No tenants match your search."}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.sortBar}>
            {([
              ["fullName", "Name"],
              ["shopNumber", "Shop"],
              ["rentAmount", "Rent"],
              ["status", "Status"],
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

        {filtered.map((tenant) => {
          const dueIn = daysUntilDue(tenant.dueDate);
          const dueLabel = tenant.paid
            ? "Paid"
            : dueIn < 0
              ? `Overdue ${Math.abs(dueIn)}d`
              : `Due ${dueIn}d`;

          return (
            <Link
              key={tenant.id}
              href={`/tenant-detail?id=${tenant.id}`}
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
                      {tenant.fullName}
                    </ThemedText>
                    <ThemedText style={styles.tenantMeta}>
                      Shop {tenant.shopNumber}
                      {tenant.businessType ? ` · ${tenant.businessType}` : ""}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: tenant.paid
                          ? "#4CAF50"
                          : dueIn < 0
                            ? "#E53935"
                            : "#FB8C00",
                      },
                    ]}
                  >
                    <ThemedText style={styles.statusText}>
                      {dueLabel}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <ThemedText style={styles.rentText}>
                    {formatCurrency(tenant.rentAmount)}
                  </ThemedText>
                  <ThemedText style={styles.phoneText}>
                    {tenant.phoneNumber || "—"}
                  </ThemedText>
                </View>
              </Pressable>
            </Link>
          );
        })}
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
  tenantMeta: {
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
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentText: {
    fontSize: 16,
    fontWeight: "700",
  },
  phoneText: {
    fontSize: 13,
    opacity: 0.6,
  },
});
