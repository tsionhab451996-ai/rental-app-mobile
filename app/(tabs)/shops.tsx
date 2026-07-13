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
import { useShops } from "@/contexts/ShopContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

type SortKey = "shopNumber" | "shopName" | "rentPrice" | "status";

export default function ShopsScreen() {
  const { shops, loading } = useShops();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("shopNumber");
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
    ? shops.filter(
        (s) =>
          s.shopNumber.toLowerCase().includes(search.toLowerCase()) ||
          s.shopName.toLowerCase().includes(search.toLowerCase()) ||
          s.tenantName.toLowerCase().includes(search.toLowerCase()),
      )
    : shops
  ).sort((a, b) => {
    let cmp = 0;
    if (sortKey === "shopNumber") cmp = a.shopNumber.localeCompare(b.shopNumber);
    else if (sortKey === "shopName") cmp = a.shopName.localeCompare(b.shopName);
    else if (sortKey === "rentPrice") cmp = a.rentPrice - b.rentPrice;
    else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
    return sortAsc ? cmp : -cmp;
  });

  const statusColor = (status: string) =>
    status === "occupied" ? "#4CAF50" : "#9E9E9E";

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: "Shop Management" }} />
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Shop Management" }} />
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
          placeholder="Search by number, name, or tenant..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        <Link href="/shop-form" asChild>
          <Pressable style={[styles.addButton, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.addButtonText}>+ Add Shop</ThemedText>
          </Pressable>
        </Link>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <ThemedText style={{ opacity: 0.5, textAlign: "center" }}>
              {shops.length === 0
                ? "No shops yet. Tap + Add Shop to get started."
                : "No shops match your search."}
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Pressable style={styles.colNumber} onPress={() => toggleSort("shopNumber")}>
                <ThemedText style={styles.th}>#{sortIcon("shopNumber")}</ThemedText>
              </Pressable>
              <Pressable style={styles.colName} onPress={() => toggleSort("shopName")}>
                <ThemedText style={styles.th}>Name{sortIcon("shopName")}</ThemedText>
              </Pressable>
              <ThemedText style={[styles.th, styles.colFloor]}>Floor</ThemedText>
              <Pressable style={styles.colRent} onPress={() => toggleSort("rentPrice")}>
                <ThemedText style={styles.th}>Rent{sortIcon("rentPrice")}</ThemedText>
              </Pressable>
              <Pressable style={styles.colStatus} onPress={() => toggleSort("status")}>
                <ThemedText style={styles.th}>Status{sortIcon("status")}</ThemedText>
              </Pressable>
              <ThemedText style={[styles.th, styles.colTenant]}>Tenant</ThemedText>
            </View>
            {filtered.map((shop) => (
              <Link
                key={shop.id}
                href={`/shop-form?id=${shop.id}`}
                asChild
              >
                <Pressable
                  style={[
                    styles.shopRow,
                    {
                      backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                      borderColor: colors.icon + "30",
                    },
                  ]}
                >
                  <View style={styles.shopRowContent}>
                    <ThemedText style={styles.colNumber}>
                      {shop.shopNumber}
                    </ThemedText>
                    <ThemedText style={styles.colName} numberOfLines={1}>
                      {shop.shopName}
                    </ThemedText>
                    <ThemedText style={styles.colFloor}>{shop.floor}</ThemedText>
                    <ThemedText style={styles.colRent}>
                      {shop.rentPrice.toLocaleString()}
                    </ThemedText>
                    <View style={styles.colStatus}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: statusColor(shop.status) },
                        ]}
                      />
                      <ThemedText
                        style={{ fontSize: 12, textTransform: "capitalize" }}
                      >
                        {shop.status}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.colTenant} numberOfLines={1}>
                      {shop.tenantName || "—"}
                    </ThemedText>
                  </View>
                </Pressable>
              </Link>
            ))}
          </>
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
  },
  empty: {
    marginTop: 60,
    alignItems: "center",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#ddd",
    gap: 4,
  },
  th: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    opacity: 0.5,
  },
  shopRow: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  shopRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  colNumber: { width: "14%", fontSize: 14, fontWeight: "600" },
  colName: { width: "20%", fontSize: 13 },
  colFloor: { width: "10%", fontSize: 13 },
  colRent: { width: "16%", fontSize: 13, textAlign: "right" },
  colStatus: {
    width: "18%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  colTenant: { width: "20%", fontSize: 13 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
