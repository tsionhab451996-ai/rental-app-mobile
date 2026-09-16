import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ScreenHeader } from "@/components/ui/screen-header";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useProperty } from "@/contexts/PropertyContext";
import { useShops } from "@/contexts/ShopContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

type FilterStatus = "all" | "occupied" | "vacant" | "facility";
type SortKey = "shopNumber" | "rentPrice" | "shopName";

export default function ShopsScreen() {
  const { shops, loading } = useShops();
  const { selectedProperty } = useProperty();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("shopNumber");
  const [sortAsc, setSortAsc] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 500));
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

  const scopedPropertyShops = shops.filter(
    (s) => s.property === selectedProperty,
  );

  const filtered = scopedPropertyShops
    .filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.shopNumber.toLowerCase().includes(q) ||
        s.shopName.toLowerCase().includes(q) ||
        s.tenantName.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "shopNumber") cmp = a.shopNumber.localeCompare(b.shopNumber);
      else if (sortKey === "shopName") cmp = a.shopName.localeCompare(b.shopName);
      else if (sortKey === "rentPrice") cmp = a.rentPrice - b.rentPrice;
      return sortAsc ? cmp : -cmp;
    });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Units & Shops"
        subtitle={`${filtered.length} units in ${selectedProperty}`}
        rightAction={
          <Link href="/shop-form" asChild>
            <ScalePressable
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>New Unit</Text>
            </ScalePressable>
          </Link>
        }
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by unit #, name, tenant..."
            placeholderTextColor={colors.icon}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={18} color={colors.icon} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.chipRow}>
          {(["all", "occupied", "vacant", "facility"] as const).map((st) => {
            const active = filterStatus === st;
            const count =
              st === "all"
                ? scopedPropertyShops.length
                : scopedPropertyShops.filter((s) => s.status === st).length;
            return (
              <Pressable
                key={st}
                onPress={() => setFilterStatus(st)}
                style={[
                  styles.filterChip,
                  active
                    ? [styles.filterChipActive, { backgroundColor: colors.tint }]
                    : [
                        styles.filterChipInactive,
                        {
                          backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                          borderColor: colors.border,
                        },
                      ],
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: active
                        ? "#FFFFFF"
                        : isDark
                        ? "#94A3B8"
                        : "#64748B",
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)} ({count})
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => toggleSort("rentPrice")}
            style={[
              styles.sortBtn,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="swap-vertical" size={14} color={colors.icon} />
            <Text style={[styles.sortBtnText, { color: colors.textSecondary }]}>
              Rent {sortKey === "rentPrice" ? (sortAsc ? "▲" : "▼") : ""}
            </Text>
          </Pressable>
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={[styles.listContent, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="business-outline"
              size={48}
              color={colors.icon}
              style={{ opacity: 0.5, marginBottom: 12 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Units Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {scopedPropertyShops.length === 0
                ? `No units added yet in ${selectedProperty}. Tap '+ New Unit' below to create your first space.`
                : "No units match your current search or filter."}
            </Text>
            {scopedPropertyShops.length === 0 && (
              <Link href="/shop-form" asChild>
                <ScalePressable
                  style={[
                    styles.addBtn,
                    { backgroundColor: colors.tint, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
                  ]}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Add Unit</Text>
                </ScalePressable>
              </Link>
            )}
          </View>
        ) : (
          filtered.map((shop) => {
            const isOccupied = shop.status === "occupied";
            return (
              <Link key={shop.id} href={`/shop-form?id=${shop.id}`} asChild>
                <ScalePressable
                  style={[
                    styles.shopCard,
                    {
                      backgroundColor: isDark ? "#151F32" : "#FFFFFF",
                      borderColor: isDark ? "#23324D" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.unitBadgeRow}>
                      <View
                        style={[
                          styles.unitNumberBadge,
                          {
                            backgroundColor: isDark
                              ? "rgba(59, 130, 246, 0.15)"
                              : "#EFF6FF",
                          },
                        ]}
                      >
                        <Text style={[styles.unitNumberText, { color: colors.tint }]}>
                          Unit {shop.shopNumber}
                        </Text>
                      </View>
                      {shop.floor ? (
                        <View
                          style={[
                            styles.floorBadge,
                            {
                              backgroundColor: isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.floorText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {shop.floor}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Status Pill */}
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            shop.status === "occupied"
                              ? isDark
                                ? "rgba(16, 185, 129, 0.15)"
                                : "#ECFDF5"
                              : shop.status === "facility"
                              ? isDark
                                ? "rgba(99, 102, 241, 0.15)"
                                : "#EEF2FF"
                              : isDark
                              ? "rgba(245, 158, 11, 0.15)"
                              : "#FFFBEB",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor:
                              shop.status === "occupied"
                                ? "#10B981"
                                : shop.status === "facility"
                                ? "#6366F1"
                                : "#F59E0B",
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color:
                              shop.status === "occupied"
                                ? "#10B981"
                                : shop.status === "facility"
                                ? "#6366F1"
                                : "#D97706",
                          },
                        ]}
                      >
                        {shop.status === "occupied"
                          ? "Occupied"
                          : shop.status === "facility"
                          ? "Facility"
                          : "Vacant"}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.shopName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {shop.shopName}
                  </Text>

                  {/* Tenant information */}
                  <View style={styles.tenantRow}>
                    <Ionicons
                      name="person-outline"
                      size={14}
                      color={colors.icon}
                    />
                    <Text
                      style={[
                        styles.tenantName,
                        { color: colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {shop.tenantName ? shop.tenantName : "No tenant assigned"}
                    </Text>
                  </View>

                  {/* Pricing and Details Footer */}
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: isDark ? "#1E293B" : "#F1F5F9" },
                    ]}
                  >
                    <View>
                      <Text
                        style={[styles.priceLabel, { color: colors.textSecondary }]}
                      >
                        Monthly Rent
                      </Text>
                      <Text style={[styles.priceValue, { color: colors.text }]}>
                        ETB {shop.rentPrice.toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.cardArrow}>
                      <Text style={[styles.editHint, { color: colors.tint }]}>
                        Details
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.tint}
                      />
                    </View>
                  </View>
                </ScalePressable>
              </Link>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  clearSearch: {
    padding: 4,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterChipActive: {},
  filterChipInactive: {
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
  },
  sortBtn: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  shopCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  unitBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unitNumberBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unitNumberText: {
    fontSize: 12,
    fontWeight: "800",
  },
  floorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  floorText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  shopName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  tenantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  tenantName: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 1,
  },
  cardArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  editHint: {
    fontSize: 13,
    fontWeight: "600",
  },
});
