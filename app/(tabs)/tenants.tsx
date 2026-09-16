import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  calculateTenantRentStatus,
  getEthiopianScheduleShort,
} from "@/utils/ethiopianCalendar";

const formatCurrency = (value: number) => `ETB ${value.toLocaleString()}`;

const daysUntilDue = (dueDate: string) => {
  return Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
};

type FilterStatus = "all" | "paid" | "pending" | "overdue";
type SortKey = "fullName" | "shopNumber" | "rentAmount";

export default function TenantsScreen() {
  const { tenants, loading } = useTenants();
  const { selectedProperty } = useProperty();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
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

  const scopedPropertyTenants = tenants.filter(
    (t) => t.property === selectedProperty,
  );

  const filtered = scopedPropertyTenants
    .filter((t) => {
      const rentStatus = calculateTenantRentStatus(t.paid);
      if (filterStatus === "paid" && rentStatus.status !== "Paid") return false;
      if (filterStatus === "pending" && rentStatus.status !== "Pending") return false;
      if (filterStatus === "overdue" && rentStatus.status !== "Overdue") return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.fullName.toLowerCase().includes(q) ||
        t.shopNumber.toLowerCase().includes(q) ||
        (t.phoneNumber && t.phoneNumber.includes(q)) ||
        (t.businessType && t.businessType.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "fullName") cmp = a.fullName.localeCompare(b.fullName);
      else if (sortKey === "shopNumber") cmp = a.shopNumber.localeCompare(b.shopNumber);
      else if (sortKey === "rentAmount") cmp = a.rentAmount - b.rentAmount;
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
        title="Tenants"
        subtitle={`${filtered.length} active occupants in ${selectedProperty}`}
        rightAction={
          <Link href="/tenant-form" asChild>
            <ScalePressable
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Tenant</Text>
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
            placeholder="Search tenant name, unit #, phone..."
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
          {(["all", "paid", "pending", "overdue"] as const).map((st) => {
            const active = filterStatus === st;
            const label =
              st === "all"
                ? "All"
                : st === "paid"
                ? "Paid"
                : st === "pending"
                ? "Pending"
                : "Overdue";
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
                  {label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => toggleSort("fullName")}
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
              Name {sortKey === "fullName" ? (sortAsc ? "▲" : "▼") : ""}
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
              name="people-outline"
              size={48}
              color={colors.icon}
              style={{ opacity: 0.5, marginBottom: 12 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Tenants Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {scopedPropertyTenants.length === 0
                ? `No tenants added yet in ${selectedProperty}. Tap '+ Add Tenant' below to create one.`
                : "No tenant profiles match your filter or search query."}
            </Text>
            {scopedPropertyTenants.length === 0 && (
              <Link href="/tenant-form" asChild>
                <ScalePressable
                  style={[
                    styles.addBtn,
                    { backgroundColor: colors.tint, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
                  ]}
                >
                  <Ionicons name="person-add" size={16} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Add Tenant</Text>
                </ScalePressable>
              </Link>
            )}
          </View>
        ) : (
          filtered.map((tenant) => {
            const dueIn = daysUntilDue(tenant.dueDate);
            const isOverdue = !tenant.paid && dueIn < 0;

            const initials = tenant.fullName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0].toUpperCase())
              .join("");

            return (
              <Link
                key={tenant.id}
                href={`/tenant-detail?id=${tenant.id}`}
                asChild
              >
                <ScalePressable
                  style={[
                    styles.tenantCard,
                    {
                      backgroundColor: isDark ? "#151F32" : "#FFFFFF",
                      borderColor: isDark ? "#23324D" : "#E2E8F0",
                    },
                  ]}
                >
                  <View style={styles.cardMain}>
                    {/* Avatar Initials */}
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: isDark
                            ? "rgba(59, 130, 246, 0.2)"
                            : "#EFF6FF",
                        },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: colors.tint }]}>
                        {initials || "T"}
                      </Text>
                    </View>

                    {/* Tenant Details */}
                    <View style={styles.infoCol}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[styles.tenantName, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {tenant.fullName}
                        </Text>
                        {/* Status Pill */}
                        {(() => {
                          const rentStatus = calculateTenantRentStatus(tenant.paid);
                          const pillBg =
                            rentStatus.status === "Paid"
                              ? isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5"
                              : rentStatus.status === "Pending"
                              ? isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB"
                              : isDark ? "rgba(239, 68, 68, 0.16)" : "#FEF2F2";
                          const pillColor =
                            rentStatus.status === "Paid"
                              ? "#10B981"
                              : rentStatus.status === "Pending"
                              ? isDark ? "#FBBF24" : "#D97706"
                              : isDark ? "#F87171" : "#EF4444";

                          return (
                            <View
                              style={[
                                styles.statusPill,
                                { backgroundColor: pillBg },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusPillText,
                                  { color: pillColor },
                                ]}
                              >
                                {rentStatus.badgeLabel}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>

                      {/* Meta Tags */}
                      <View style={styles.metaRow}>
                        <View
                          style={[
                            styles.unitChip,
                            {
                              backgroundColor: isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            Unit {tenant.shopNumber}
                          </Text>
                        </View>
                        {tenant.businessType ? (
                          <Text
                            style={[
                              styles.businessType,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={1}
                          >
                            · {tenant.businessType}
                          </Text>
                        ) : null}
                      </View>

                      {tenant.leasePeriod ? (
                        <View style={styles.leaseRow}>
                          <Ionicons name="calendar-outline" size={11} color={colors.textSecondary} />
                          <Text style={[styles.leasePeriodText, { color: colors.textSecondary }]}>
                            {tenant.leasePeriod}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {/* Card Footer with Quick Contact Actions & Rent */}
                  <View
                    style={[
                      styles.cardFooter,
                      { borderTopColor: isDark ? "#1E293B" : "#F1F5F9" },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.rentLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Rent Due • {getEthiopianScheduleShort()}
                      </Text>
                      <Text style={[styles.rentValue, { color: colors.text }]}>
                        {formatCurrency(tenant.rentAmount)}
                      </Text>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      {tenant.phoneNumber ? (
                        <Pressable
                          style={[
                            styles.contactBtn,
                            {
                              backgroundColor: isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                            },
                          ]}
                          onPress={() =>
                            Linking.openURL(`tel:${tenant.phoneNumber}`)
                          }
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color={colors.tint}
                          />
                        </Pressable>
                      ) : null}

                      {tenant.telegramUsername ? (
                        <Pressable
                          style={[
                            styles.contactBtn,
                            {
                              backgroundColor: isDark
                                ? "#1E293B"
                                : "#F1F5F9",
                            },
                          ]}
                          onPress={() =>
                            Linking.openURL(
                              `https://t.me/${tenant.telegramUsername.replace("@", "")}`,
                            )
                          }
                        >
                          <Ionicons
                            name="paper-plane-outline"
                            size={16}
                            color="#38BDF8"
                          />
                        </Pressable>
                      ) : null}

                      <View style={styles.cardArrow}>
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={colors.icon}
                        />
                      </View>
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
  tenantCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  businessType: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  leaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  leasePeriodText: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rentLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  rentValue: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cardArrow: {
    marginLeft: 4,
  },
});
