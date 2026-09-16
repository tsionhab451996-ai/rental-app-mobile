import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProperty,
  type PropertyName,
  PROPERTIES_DATA,
  PROPERTY_NAMES,
} from "@/contexts/PropertyContext";
import { useShops } from "@/contexts/ShopContext";

export default function PropertySelectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedProperty, selectedProperty } = useProperty();
  const { shops } = useShops();

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  const handleSelectProperty = async (propName: PropertyName) => {
    await setSelectedProperty(propName);
    router.replace({
      pathname: "/(tabs)",
      params: { property: propName },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Row with Logo, RENTAL badge, and Subtitle */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <BrandLogo size="md" />
            <View style={styles.brandTextGroup}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.brandTitle}>RentalApp</Text>
                <View style={styles.rentalBadge}>
                  <Text style={styles.rentalBadgeText}>MARKETPLACE</Text>
                </View>
              </View>
              <Text style={styles.brandSubtitle}>Property & Tenant Hub</Text>
            </View>
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.welcomeGreeting}>
            Welcome, {user?.username ?? "Landlord"} 👋
          </Text>
          <Text style={styles.pageTitle}>Select a Property</Text>
          <Text style={styles.pageSubtitle}>
            Choose one of your managed properties to enter its live dashboard
          </Text>
        </View>

        {/* Property Cards List */}
        <View style={styles.cardList}>
          {PROPERTY_NAMES.map((name) => {
            const info = PROPERTIES_DATA[name];
            const propShops = shops.filter((s) => s.property === name);
            const occupiedUnits = propShops.filter((s) => s.status === "occupied").length;
            const totalUnits = propShops.length;
            const isCurrent = selectedProperty === name;

            return (
              <ScalePressable
                key={name}
                onPress={() => handleSelectProperty(name)}
                style={[
                  styles.propertyCard,
                  isCurrent && styles.propertyCardSelected,
                ]}
              >
                <LinearGradient
                  colors={
                    isCurrent
                      ? ["#172554", "#1E3A8A", "#1E293B"]
                      : ["#131F37", "#162544", "#10192C"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardGradient}
                >
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${info.color}22` },
                      ]}
                    >
                      <Ionicons
                        name="business"
                        size={24}
                        color={info.color}
                      />
                    </View>

                    <View style={styles.propertyHeaderInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.propertyName}>{info.name}</Text>
                        {isCurrent && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.propertyTagline}>{info.tagline}</Text>
                    </View>

                    <View style={styles.chevronWrapper}>
                      <Ionicons
                        name="chevron-forward-circle"
                        size={24}
                        color={isCurrent ? "#60A5FA" : "#64748B"}
                      />
                    </View>
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Meta Chips */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.metaChip}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#94A3B8"
                      />
                      <Text style={styles.metaChipText} numberOfLines={1}>
                        {info.location}
                      </Text>
                    </View>

                    <View style={styles.statsRow}>
                      <View style={styles.statPill}>
                        <Text style={styles.statPillLabel}>Units: </Text>
                        <Text style={styles.statPillVal}>{totalUnits}</Text>
                      </View>

                      <View
                        style={[
                          styles.statPill,
                          {
                            backgroundColor: "rgba(16, 185, 129, 0.15)",
                            borderColor: "rgba(16, 185, 129, 0.3)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statPillLabel,
                            { color: "#34D399" },
                          ]}
                        >
                          {occupiedUnits} Occupied
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </ScalePressable>
            );
          })}
        </View>

        {/* Footer Note */}
        <View style={styles.footerInfo}>
          <Ionicons name="information-circle-outline" size={16} color="#64748B" />
          <Text style={styles.footerText}>
            You can switch between properties at any time from the dashboard header.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandTextGroup: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  rentalBadge: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rentalBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: 1,
  },
  greetingSection: {
    marginBottom: 24,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: "#60A5FA",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#F8FAFC",
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 6,
    lineHeight: 20,
  },
  cardList: {
    gap: 16,
    marginBottom: 24,
  },
  propertyCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  propertyCardSelected: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cardGradient: {
    padding: 18,
    borderRadius: 20,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  propertyHeaderInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  propertyName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  activeTag: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DBEAFE",
  },
  propertyTagline: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "500",
  },
  chevronWrapper: {
    paddingLeft: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 14,
  },
  cardBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "52%",
  },
  metaChipText: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statPillLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
  },
  statPillVal: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    flex: 1,
  },
});
