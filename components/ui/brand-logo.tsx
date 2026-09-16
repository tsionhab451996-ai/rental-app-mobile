import React from "react";
import { StyleSheet, View, Text, Image } from "react-native";

type BrandLogoSize = "sm" | "md" | "lg" | "xl";

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  textColor?: string;
  subtextColor?: string;
  variant?: "blue" | "dark" | "glass";
}

const sizeConfig: Record<
  BrandLogoSize,
  {
    boxSize: number;
    borderRadius: number;
    titleSize: number;
    subtitleSize: number;
  }
> = {
  sm: {
    boxSize: 36,
    borderRadius: 10,
    titleSize: 16,
    subtitleSize: 11,
  },
  md: {
    boxSize: 48,
    borderRadius: 14,
    titleSize: 20,
    subtitleSize: 12,
  },
  lg: {
    boxSize: 72,
    borderRadius: 20,
    titleSize: 24,
    subtitleSize: 13,
  },
  xl: {
    boxSize: 96,
    borderRadius: 26,
    titleSize: 30,
    subtitleSize: 14,
  },
};

export function BrandLogo({
  size = "md",
  showText = false,
  textColor = "#FFFFFF",
  subtextColor = "rgba(255, 255, 255, 0.7)",
}: BrandLogoProps) {
  const cfg = sizeConfig[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.glowOuter,
          {
            width: cfg.boxSize + 6,
            height: cfg.boxSize + 6,
            borderRadius: cfg.borderRadius + 3,
          },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={{
            width: cfg.boxSize,
            height: cfg.boxSize,
            borderRadius: cfg.borderRadius,
          }}
          resizeMode="cover"
        />
      </View>

      {showText && (
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.brandTitle,
                { fontSize: cfg.titleSize, color: textColor },
              ]}
            >
              Rental<Text style={styles.brandTitleAccent}>App</Text>
            </Text>
            <View style={styles.proPill}>
              <Text style={styles.proPillText}>MARKETPLACE</Text>
            </View>
          </View>
          <Text
            style={[
              styles.brandSubtitle,
              { fontSize: cfg.subtitleSize, color: subtextColor },
            ]}
          >
            Property & Tenant Hub
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  glowOuter: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b1219",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  textContainer: {
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandTitle: {
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: "#60A5FA",
    fontWeight: "800",
  },
  proPill: {
    backgroundColor: "rgba(96, 165, 250, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "rgba(96, 165, 250, 0.4)",
  },
  proPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#60A5FA",
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontWeight: "500",
    marginTop: 1,
    letterSpacing: 0.2,
  },
});
