import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { usePayments } from "@/contexts/PaymentContext";
import { useProperty } from "@/contexts/PropertyContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useShops } from "@/contexts/ShopContext";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  toEthiopianDate,
  getEthiopianPaymentSchedule,
  getEthiopianScheduleShort,
  calculateTenantRentStatus,
} from "@/utils/ethiopianCalendar";

const REMINDER_DAYS_BEFORE = 3;

const daysUntilDue = (dueDate: string) => {
  const timestamp = new Date(dueDate).getTime();
  if (isNaN(timestamp)) return 0;
  return Math.ceil(
    (timestamp - Date.now()) / (1000 * 60 * 60 * 24),
  );
};

const formatCurrency = (value: number) => `ETB ${value.toLocaleString()}`;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const { user } = useAuth();
  const { selectedProperty, propertyInfo } = useProperty();
  const { shops } = useShops();
  const { tenants } = useTenants();
  const { payments } = usePayments();
  const { settings } = useSettings();

  const [notificationsToday, setNotificationsToday] = useState(0);
  const autoReminderRan = useRef(false);

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  // Filter scoped data strictly for selected property
  const scopedShops = useMemo(() => {
    return shops.filter((s) => s.property === selectedProperty);
  }, [shops, selectedProperty]);

  const scopedTenants = useMemo(() => {
    return tenants.filter((t) => t.property === selectedProperty);
  }, [tenants, selectedProperty]);

  const scopedPayments = useMemo(() => {
    return payments.filter((p) => p.property === selectedProperty);
  }, [payments, selectedProperty]);

  // Dashboard Stats scoped strictly to active property
  const dashboardStats = useMemo(() => {
    const totalShops = scopedShops.length;
    const occupiedShops = scopedShops.filter((s) => s.status === "occupied").length;
    const vacantShops = scopedShops.filter((s) => s.status === "vacant").length;
    const facilityShops = scopedShops.filter((s) => s.status === "facility").length;
    const totalTenants = scopedTenants.length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

    const expectedMonthlyRent = scopedTenants.reduce(
      (sum, t) => sum + (t.rentAmount || 0),
      0,
    );

    const collectedFromPayments = scopedPayments
      .filter((p) => p.paymentMonth === monthStr && p.status === "paid")
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const collectedFromTenants = scopedTenants
      .filter((t) => t.paid)
      .reduce((sum, t) => sum + (t.rentAmount || 0), 0);

    // ETB Collected (Mo): strictly from paid records, starts at 0
    const monthlyIncome = Math.max(collectedFromPayments, collectedFromTenants);

    // Unpaid Rent: starts at expected monthly sum (e.g., ETB 234,000 for Zenebework)
    const unpaidRent = Math.max(0, expectedMonthlyRent - monthlyIncome);
    const unpaidTenantsCount = scopedTenants.filter((t) => !t.paid).length;

    // Ethiopian Calendar status calculations
    const ethToday = toEthiopianDate();
    const scheduleEn = getEthiopianPaymentSchedule(new Date(), "en");
    const scheduleShort = getEthiopianScheduleShort(new Date());

    const paidTenants = scopedTenants.filter((t) => t.paid);
    const pendingTenants = scopedTenants.filter((t) => {
      if (t.paid) return false;
      return calculateTenantRentStatus(t.paid).status === "Pending";
    });
    const overdueTenants = scopedTenants.filter((t) => {
      if (t.paid) return false;
      return calculateTenantRentStatus(t.paid).status === "Overdue";
    });

    const overdueRentAmount = overdueTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);
    const pendingRentAmount = pendingTenants.reduce((sum, t) => sum + (t.rentAmount || 0), 0);

    const totalFines = scopedPayments.reduce((sum, p) => sum + p.fine, 0);

    return {
      totalShops,
      occupiedShops,
      vacantShops,
      facilityShops,
      totalTenants,
      expectedMonthlyRent,
      monthlyIncome,
      unpaidRent,
      unpaidTenantsCount,
      paidCount: paidTenants.length,
      pendingCount: pendingTenants.length,
      overdueCount: overdueTenants.length,
      overdueRentAmount,
      pendingRentAmount,
      ethToday,
      scheduleEn,
      scheduleShort,
      overduePayments: overdueTenants.length,
      notificationsToday,
      totalFines,
    };
  }, [scopedShops, scopedTenants, scopedPayments, notificationsToday]);

  const sendTelegramReminder = useCallback(
    async (tenant: {
      fullName: string;
      rentAmount: number;
      dueDate: string;
      telegramUsername: string;
      paid?: boolean;
    }) => {
      if (!tenant.telegramUsername.trim()) return;
      const botToken = settings.notifications.telegramBotToken;
      if (!botToken) return;

      const rentStatus = calculateTenantRentStatus(tenant.paid ?? false);
      const scheduleText = getEthiopianPaymentSchedule(new Date(), "en");
      const message = rentStatus.isOverdue
        ? `Hello ${tenant.fullName},\nUrgent notice: Your rental payment of ${formatCurrency(tenant.rentAmount)} for ${rentStatus.ethDate.monthNameEn} is overdue past the 7th deadline (${scheduleText}). Please settle immediately with the landlord.`
        : `Hello ${tenant.fullName},\nYour rental payment of ${formatCurrency(tenant.rentAmount)} is due during the Ethiopian monthly cycle (${scheduleText}). Please settle with the landlord.`;

      try {
        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
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
    },
    [settings.notifications.telegramBotToken],
  );

  useEffect(() => {
    if (!settings.notifications.enableTelegram || !settings.notifications.telegramBotToken) return;
    if (autoReminderRan.current) return;
    autoReminderRan.current = true;

    const eligible = scopedTenants.filter(
      (t) =>
        !t.paid &&
        t.telegramUsername.trim() &&
        daysUntilDue(t.dueDate) <= REMINDER_DAYS_BEFORE,
    );
    eligible.forEach((t) => sendTelegramReminder(t));
  }, [scopedTenants, sendTelegramReminder, settings.notifications.enableTelegram, settings.notifications.telegramBotToken]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName = user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : "Landlord";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? "#0B1220" : colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Hero Banner with Glassmorphic Gradient */}
        <LinearGradient
          colors={
            isDark
              ? ["#0b1219", "#101a24", "#152433"]
              : ["#0b1219", "#122030", "#18324e"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBanner, { paddingTop: topInset + 12 }]}
        >
          {/* Top Row: RentalApp Logo, Marketplace Badge, Subtitle & Profile Avatar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <BrandLogo size="sm" />
              <View style={styles.brandTextCol}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.brandTitleText}>RentalApp</Text>
                  <View style={styles.rentalPill}>
                    <Text style={styles.rentalPillText}>MARKETPLACE</Text>
                  </View>
                </View>
                <Text style={styles.brandSubtitleText}>Property & Tenant Hub</Text>
              </View>
            </View>

            <Link href="/(tabs)/account" asChild>
              <ScalePressable style={styles.avatarButton}>
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarLetter}>
                    {displayName.charAt(0)}
                  </Text>
                </View>
              </ScalePressable>
            </Link>
          </View>

          {/* Greeting & Title Area */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              {greeting}, {displayName} 👋
            </Text>
            <Text style={styles.pageTitle}>Overview Dashboard</Text>
          </View>

          {/* Property Switcher Banner / Button */}
          <ScalePressable
            onPress={() => router.push("/property-select")}
            style={styles.propertySwitcherBar}
          >
            <View style={styles.propertySwitcherLeft}>
              <View style={styles.propertyIconBadge}>
                <Ionicons name="business" size={16} color="#60A5FA" />
              </View>
              <View>
                <Text style={styles.propertySwitcherLabel}>Active Property</Text>
                <Text style={styles.propertySwitcherName}>
                  {selectedProperty} • {propertyInfo.tagline}
                </Text>
              </View>
            </View>

            <View style={styles.switchButtonPill}>
              <Text style={styles.switchButtonText}>Switch</Text>
              <Ionicons name="swap-horizontal" size={14} color="#93C5FD" />
            </View>
          </ScalePressable>

          {/* Metrics Banner Card: 3 Columns (Total Units, Active Tenants, ETB Collected) */}
          <View style={styles.metricsBannerCard}>
            <View style={styles.bannerCol}>
              <Text style={styles.bannerValue}>
                {dashboardStats.totalShops}
              </Text>
              <Text style={styles.bannerLabel}>Total Units</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerCol}>
              <Text style={styles.bannerValue}>
                {dashboardStats.totalTenants}
              </Text>
              <Text style={styles.bannerLabel}>Active Tenants</Text>
            </View>
            <View style={styles.bannerDivider} />
            <View style={styles.bannerCol}>
              <Text style={styles.bannerValue}>
                {dashboardStats.monthlyIncome > 0
                  ? `${(dashboardStats.monthlyIncome / 1000).toFixed(0)}k`
                  : "0"}
              </Text>
              <Text style={styles.bannerLabel}>ETB Collected (Mo)</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Ethiopian Calendar Payment Schedule & Alert Banner */}
        {dashboardStats.overdueCount > 0 ? (
          <Link href="/(tabs)/tenants" asChild>
            <ScalePressable style={styles.alertCard}>
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0.08)"]
                    : ["#FEF2F2", "#FEE2E2"]
                }
                style={[
                  styles.alertGradient,
                  { borderColor: isDark ? "#EF4444" : "#FCA5A5" },
                ]}
              >
                <View style={[styles.alertIconBg, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>
                    Overdue Rent: {formatCurrency(dashboardStats.overdueRentAmount)}
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: isDark ? "#F87171" : "#B91C1C" }]}>
                    {dashboardStats.overdueCount} tenant{dashboardStats.overdueCount > 1 ? "s" : ""} past {dashboardStats.scheduleEn} deadline (Day 7)
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#EF4444" />
              </LinearGradient>
            </ScalePressable>
          </Link>
        ) : dashboardStats.unpaidRent > 0 ? (
          <Link href="/(tabs)/tenants" asChild>
            <ScalePressable style={styles.alertCard}>
              <LinearGradient
                colors={
                  isDark
                    ? ["rgba(245, 158, 11, 0.2)", "rgba(245, 158, 11, 0.08)"]
                    : ["#FFFBEB", "#FEF3C7"]
                }
                style={[
                  styles.alertGradient,
                  { borderColor: isDark ? "#F59E0B" : "#FCD34D" },
                ]}
              >
                <View style={[styles.alertIconBg, { backgroundColor: "rgba(245, 158, 11, 0.2)" }]}>
                  <Ionicons name="time" size={20} color="#D97706" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: isDark ? "#FBBF24" : "#92400E" }]}>
                    Pending Rent: {formatCurrency(dashboardStats.unpaidRent)}
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: isDark ? "#FCD34D" : "#B45309" }]}>
                    Due Window: {dashboardStats.scheduleEn} • {dashboardStats.pendingCount} tenant{dashboardStats.pendingCount !== 1 ? "s" : ""} pending
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D97706" />
              </LinearGradient>
            </ScalePressable>
          </Link>
        ) : null}

        {/* Property Status Section (2x2 Grid) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: isDark ? "#F8FAFC" : colors.text }]}>
              Property Status
            </Text>
            <Text style={styles.propertyContextTag}>{selectedProperty}</Text>
          </View>

          <View style={styles.statusGrid}>
            <View style={styles.statusGridRow}>
              {/* Occupied Units */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Occupied Units
                  </Text>
                </View>
                <Text style={[styles.statusCardValue, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                  {dashboardStats.occupiedShops}
                </Text>
              </View>

              {/* Vacant Units */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                    <Ionicons name="home" size={19} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Vacant Units
                  </Text>
                </View>
                <Text style={[styles.statusCardValue, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                  {dashboardStats.vacantShops}
                </Text>
              </View>
            </View>

            <View style={styles.statusGridRow}>
              {/* Expected Monthly Rent */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                    <Ionicons name="cash" size={18} color="#10B981" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Expected Rent
                  </Text>
                </View>
                <Text
                  style={[styles.statusCardValue, { color: isDark ? "#34D399" : "#059669" }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(dashboardStats.expectedMonthlyRent)}
                </Text>
              </View>

              {/* Unpaid Rent */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                    <Ionicons name="time" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Unpaid Rent
                  </Text>
                </View>
                <Text
                  style={[styles.statusCardValue, { color: isDark ? "#FBBF24" : "#D97706" }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(dashboardStats.unpaidRent)}
                </Text>
              </View>
            </View>

            <View style={styles.statusGridRow}>
              {/* Facility Units */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(99, 102, 241, 0.15)" }]}>
                    <Ionicons name="cube" size={18} color="#818CF8" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Facility Units
                  </Text>
                </View>
                <Text
                  style={[styles.statusCardValue, { color: isDark ? "#F8FAFC" : "#0F172A" }]}
                >
                  {dashboardStats.facilityShops}
                </Text>
              </View>

              {/* Due Window (Ethiopian Calendar) */}
              <View
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={styles.statusCardTop}>
                  <View style={[styles.statusIconBadge, { backgroundColor: "rgba(59, 130, 246, 0.15)" }]}>
                    <Ionicons name="calendar" size={18} color="#3B82F6" />
                  </View>
                  <Text style={[styles.statusCardLabel, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Due Schedule
                  </Text>
                </View>
                <Text
                  style={[styles.statusCardValue, { color: isDark ? "#60A5FA" : "#2563EB", fontSize: 16 }]}
                  numberOfLines={1}
                >
                  {dashboardStats.scheduleShort}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Empty State Banner when property has no tenants (e.g. CMC fresh setup) */}
        {scopedTenants.length === 0 && (
          <View style={styles.sectionContainer}>
            <View
              style={[
                styles.emptyDashboardCard,
                {
                  backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                },
              ]}
            >
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(59, 130, 246, 0.15)"
                      : "#EFF6FF",
                  },
                ]}
              >
                <Ionicons name="business-outline" size={32} color={colors.tint} />
              </View>
              <Text
                style={[
                  styles.emptyDashboardTitle,
                  { color: isDark ? "#F8FAFC" : colors.text },
                ]}
              >
                No tenants added yet in {selectedProperty}
              </Text>
              <Text
                style={[
                  styles.emptyDashboardSubtitle,
                  { color: isDark ? "#94A3B8" : colors.textSecondary },
                ]}
              >
                {selectedProperty} has zero active occupants. Ready for manual entry: add your commercial units and tenants below.
              </Text>

              <View style={styles.emptyActionRow}>
                <Link href="/tenant-form" asChild>
                  <ScalePressable
                    style={[
                      styles.emptyBtnPrimary,
                      { backgroundColor: colors.tint },
                    ]}
                  >
                    <Ionicons name="person-add" size={16} color="#FFFFFF" />
                    <Text style={styles.emptyBtnText}>Add Tenant</Text>
                  </ScalePressable>
                </Link>

                <Link href="/shop-form" asChild>
                  <ScalePressable
                    style={[
                      styles.emptyBtnSecondary,
                      {
                        backgroundColor: isDark ? "#1E293B" : "#F8FAFC",
                        borderColor: isDark ? "#334155" : "#CBD5E1",
                      },
                    ]}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={colors.tint} />
                    <Text style={[styles.emptyBtnTextSecondary, { color: colors.tint }]}>
                      Add Unit
                    </Text>
                  </ScalePressable>
                </Link>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions Section (Rounded Vertical Action Cards with Badges & Arrows) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F8FAFC" : colors.text }]}>
            Quick Actions
          </Text>

          <View style={styles.verticalActionsContainer}>
            {/* Action 1: Manage Shops / Units */}
            <Link href="/(tabs)/shops" asChild>
              <ScalePressable
                style={[
                  styles.verticalActionCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={[styles.actionBadge, { backgroundColor: "rgba(37, 99, 235, 0.18)" }]}>
                  <Ionicons name="business" size={22} color="#3B82F6" />
                </View>
                <View style={styles.actionInfoCol}>
                  <Text style={[styles.actionTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                    Manage Units & Shops
                  </Text>
                  <Text style={[styles.actionDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    View shop inventory, floor assignments & rents
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "#64748B" : "#94A3B8"} />
              </ScalePressable>
            </Link>

            {/* Action 2: Manage Tenants */}
            <Link href="/(tabs)/tenants" asChild>
              <ScalePressable
                style={[
                  styles.verticalActionCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={[styles.actionBadge, { backgroundColor: "rgba(124, 58, 237, 0.18)" }]}>
                  <Ionicons name="people" size={22} color="#8B5CF6" />
                </View>
                <View style={styles.actionInfoCol}>
                  <Text style={[styles.actionTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                    Tenants Directory
                  </Text>
                  <Text style={[styles.actionDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Manage active leases, emergency contacts & alerts
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "#64748B" : "#94A3B8"} />
              </ScalePressable>
            </Link>

            {/* Action 3: Record Payment */}
            <Link href="/payment-form" asChild>
              <ScalePressable
                style={[
                  styles.verticalActionCard,
                  {
                    backgroundColor: isDark ? "#131F37" : "#FFFFFF",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
                  },
                ]}
              >
                <View style={[styles.actionBadge, { backgroundColor: "rgba(16, 185, 129, 0.18)" }]}>
                  <Ionicons name="receipt" size={22} color="#10B981" />
                </View>
                <View style={styles.actionInfoCol}>
                  <Text style={[styles.actionTitle, { color: isDark ? "#F8FAFC" : "#0F172A" }]}>
                    Record Rent Payment
                  </Text>
                  <Text style={[styles.actionDesc, { color: isDark ? "#94A3B8" : "#64748B" }]}>
                    Log cash, CBE Birr, or Telebirr transactions
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? "#64748B" : "#94A3B8"} />
              </ScalePressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  brandTextCol: {
    justifyContent: "center",
  },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  rentalPill: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  rentalPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  brandSubtitleText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  avatarButton: {
    padding: 2,
  },
  avatarInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 13,
    color: "#93C5FD",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.6,
  },
  propertySwitcherBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  propertySwitcherLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  propertyIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(59, 130, 246, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  propertySwitcherLabel: {
    fontSize: 10,
    color: "#93C5FD",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  propertySwitcherName: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: 1,
  },
  switchButtonPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchButtonText: {
    fontSize: 11,
    color: "#DBEAFE",
    fontWeight: "700",
  },
  metricsBannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19, 31, 55, 0.85)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  bannerCol: {
    flex: 1,
    alignItems: "center",
  },
  bannerValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  bannerLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  bannerDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  alertCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  alertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTextWrap: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  alertSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  propertyContextTag: {
    fontSize: 11,
    color: "#60A5FA",
    fontWeight: "700",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusGrid: {
    gap: 12,
  },
  statusGridRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  statusCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statusIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  statusCardValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  verticalActionsContainer: {
    gap: 10,
  },
  verticalActionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  actionBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfoCol: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyDashboardCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    textAlign: "center",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyDashboardTitle: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyDashboardSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  emptyActionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  emptyBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyBtnTextSecondary: {
    fontSize: 14,
    fontWeight: "700",
  },
});
