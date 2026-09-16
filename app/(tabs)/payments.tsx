import React, { useCallback, useMemo, useState } from "react";
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
import { usePayments, type Payment } from "@/contexts/PaymentContext";
import { useProperty } from "@/contexts/PropertyContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  calculateTenantRentStatus,
  getEthiopianPaymentSchedule,
} from "@/utils/ethiopianCalendar";

const formatCurrency = (value: number) => `ETB ${value.toLocaleString()}`;

type StatusFilter = "all" | "paid" | "pending" | "overdue";
type SortKey = "paymentMonth" | "tenantName" | "amountPaid" | "status";

export default function PaymentsScreen() {
  const { payments, loading } = usePayments();
  const { selectedProperty } = useProperty();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("paymentMonth");
  const [sortAsc, setSortAsc] = useState(false);
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
      setSortAsc(key === "tenantName");
    }
  };

  const scopedPayments = useMemo(() => {
    return payments.filter((p) => p.property === selectedProperty);
  }, [payments, selectedProperty]);

  const paymentStats = useMemo(() => {
    const totalCollected = scopedPayments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amountPaid, 0);
    let overdueCount = 0;
    let pendingCount = 0;
    for (const p of scopedPayments) {
      if (p.status !== "paid") {
        const rentStatus = calculateTenantRentStatus(false, new Date());
        if (rentStatus.status === "Pending") {
          pendingCount++;
        } else {
          overdueCount++;
        }
      }
    }
    return { totalCollected, overdueCount, pendingCount };
  }, [scopedPayments]);

  const filtered = scopedPayments
    .filter((p) => {
      if (filterStatus !== "all") {
        if (filterStatus === "paid" && p.status !== "paid") return false;
        if (filterStatus === "pending") {
          if (p.status === "paid") return false;
          const s = calculateTenantRentStatus(false, new Date());
          if (s.status !== "Pending") return false;
        }
        if (filterStatus === "overdue") {
          if (p.status === "paid") return false;
          const s = calculateTenantRentStatus(false, new Date());
          if (s.status !== "Overdue") return false;
        }
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const scheduleStr = getEthiopianPaymentSchedule(new Date(), "both").toLowerCase();
      return (
        p.tenantName.toLowerCase().includes(q) ||
        p.shopNumber.toLowerCase().includes(q) ||
        p.paymentMonth.includes(q) ||
        scheduleStr.includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "tenantName") cmp = a.tenantName.localeCompare(b.tenantName);
      else if (sortKey === "paymentMonth") cmp = a.paymentMonth.localeCompare(b.paymentMonth);
      else if (sortKey === "amountPaid") cmp = a.amountPaid - b.amountPaid;
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });

  const getStatusBadge = (payment: Payment) => {
    if (payment.status === "paid") {
      return {
        label: "Paid",
        color: "#10B981",
        bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5",
        icon: "checkmark-circle" as const,
      };
    }
    if (payment.status === "partial") {
      return {
        label: "Partial",
        color: "#F59E0B",
        bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
        icon: "time" as const,
      };
    }
    const rentStatus = calculateTenantRentStatus(false, new Date());
    if (rentStatus.status === "Pending") {
      return {
        label: "Pending",
        color: "#D97706",
        bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#FFFBEB",
        icon: "time" as const,
      };
    }
    return {
      label: "Overdue",
      color: "#EF4444",
      bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2",
      icon: "alert-circle" as const,
    };
  };

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
        title="Rent & Payments"
        subtitle={`${filtered.length} records in ${selectedProperty}`}
        rightAction={
          <Link href="/payment-form" asChild>
            <ScalePressable
              style={[styles.addBtn, { backgroundColor: colors.tint }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Record</Text>
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
            placeholder="Search tenant, unit #, or Ethiopian schedule..."
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

        {/* Filter & Sort Chips */}
        <View style={styles.chipRow}>
          {(["all", "paid", "pending", "overdue"] as const).map((st) => {
            const active = filterStatus === st;
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
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => toggleSort("paymentMonth")}
            style={[
              styles.sortBtn,
              {
                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={14} color={colors.icon} />
            <Text style={[styles.sortBtnText, { color: colors.textSecondary }]}>
              Schedule {sortKey === "paymentMonth" ? (sortAsc ? "▲" : "▼") : ""}
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
        {/* Quick Financial Overview Strip */}
        <View
          style={[
            styles.statsStrip,
            {
              backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.statsStripItem}>
            <Text style={[styles.statsStripLabel, { color: colors.textSecondary }]}>
              COLLECTED
            </Text>
            <Text style={[styles.statsStripVal, { color: "#10B981" }]}>
              {paymentStats.totalCollected.toLocaleString()} ETB
            </Text>
          </View>
          <View style={styles.statsStripDivider} />
          <View style={styles.statsStripItem}>
            <Text style={[styles.statsStripLabel, { color: colors.textSecondary }]}>
              PENDING
            </Text>
            <Text style={[styles.statsStripVal, { color: "#D97706" }]}>
              {paymentStats.pendingCount}
            </Text>
          </View>
          <View style={styles.statsStripDivider} />
          <View style={styles.statsStripItem}>
            <Text style={[styles.statsStripLabel, { color: colors.textSecondary }]}>
              OVERDUE
            </Text>
            <Text style={[styles.statsStripVal, { color: "#EF4444" }]}>
              {paymentStats.overdueCount}
            </Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={colors.icon}
              style={{ opacity: 0.5, marginBottom: 12 }}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Payments Found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {scopedPayments.length === 0
                ? `No payment records yet in ${selectedProperty}. Tap '+ Record' below to log rent.`
                : "No payment records match your filters."}
            </Text>
            {scopedPayments.length === 0 && (
              <Link href="/payment-form" asChild>
                <ScalePressable
                  style={[
                    styles.addBtn,
                    { backgroundColor: colors.tint, marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 },
                  ]}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.addBtnText}>Record Payment</Text>
                </ScalePressable>
              </Link>
            )}
          </View>
        ) : (
          filtered.map((payment) => {
            const badge = getStatusBadge(payment);
            return (
              <Link
                key={payment.id}
                href={`/payment-form?id=${payment.id}`}
                asChild
              >
                <ScalePressable
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: isDark ? "#151F32" : "#FFFFFF",
                      borderColor: isDark ? "#23324D" : "#E2E8F0",
                    },
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.tenantInfo}>
                      <Text
                        style={[styles.tenantName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {payment.tenantName}
                      </Text>
                      <View style={styles.subMetaRow}>
                        <View
                          style={[
                            styles.unitChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(59, 130, 246, 0.15)"
                                : "#EFF6FF",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.unitChipText,
                              { color: colors.tint },
                            ]}
                          >
                            Unit {payment.shopNumber}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.monthText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          📅 {getEthiopianPaymentSchedule(new Date(), "en")}
                        </Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Ionicons
                        name={badge.icon}
                        size={14}
                        color={badge.color}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: badge.color },
                        ]}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Financial Details Row */}
                  <View
                    style={[
                      styles.financialRow,
                      {
                        backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                        borderColor: isDark ? "#1E293B" : "#F1F5F9",
                      },
                    ]}
                  >
                    <View style={styles.finCol}>
                      <Text
                        style={[
                          styles.finLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Paid
                      </Text>
                      <Text
                        style={[
                          styles.finValue,
                          {
                            color:
                              payment.amountPaid > 0
                                ? colors.text
                                : colors.textSecondary,
                          },
                        ]}
                      >
                        {formatCurrency(payment.amountPaid)}
                      </Text>
                    </View>

                    {payment.remainingBalance > 0 && (
                      <>
                        <View style={styles.finDivider} />
                        <View style={styles.finCol}>
                          <Text
                            style={[styles.finLabel, { color: "#EF4444" }]}
                          >
                            Balance
                          </Text>
                          <Text
                            style={[
                              styles.finValue,
                              { color: "#EF4444", fontWeight: "800" },
                            ]}
                          >
                            {formatCurrency(payment.remainingBalance)}
                          </Text>
                        </View>
                      </>
                    )}

                    {payment.fine > 0 && (
                      <>
                        <View style={styles.finDivider} />
                        <View style={styles.finCol}>
                          <Text
                            style={[styles.finLabel, { color: "#F97316" }]}
                          >
                            Fine
                          </Text>
                          <Text
                            style={[
                              styles.finValue,
                              { color: "#F97316", fontWeight: "800" },
                            ]}
                          >
                            {formatCurrency(payment.fine)}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  {/* Optional notes */}
                  {payment.notes ? (
                    <Text
                      style={[styles.notes, { color: colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      💬 {payment.notes}
                    </Text>
                  ) : null}
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
  paymentCard: {
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tenantInfo: {
    flex: 1,
    marginRight: 10,
  },
  tenantName: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  subMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  unitChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  monthText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  financialRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  finValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  finDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginHorizontal: 10,
  },
  notes: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statsStripItem: {
    flex: 1,
    alignItems: "center",
  },
  statsStripLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statsStripVal: {
    fontSize: 13,
    fontWeight: "800",
  },
  statsStripDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
});
