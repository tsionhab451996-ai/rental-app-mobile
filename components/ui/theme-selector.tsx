import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemePreference } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import type { ThemeMode } from "@/contexts/SettingsContext";

export function ThemeSelector() {
  const { themeMode, resolvedTheme, setThemeMode } = useThemePreference();
  const colors = Colors[resolvedTheme];
  const isDark = resolvedTheme === "dark";

  const options: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: "system", label: "System", icon: "phone-portrait-outline" },
    { mode: "light", label: "Light", icon: "sunny-outline" },
    { mode: "dark", label: "Dark", icon: "moon-outline" },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
          borderColor: colors.border,
        },
      ]}
    >
      {options.map((opt) => {
        const isSelected = themeMode === opt.mode;
        return (
          <Pressable
            key={opt.mode}
            style={[
              styles.option,
              isSelected && [
                styles.optionActive,
                {
                  backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                  shadowColor: colors.cardShadow,
                },
              ],
            ]}
            onPress={() => setThemeMode(opt.mode)}
          >
            <Ionicons
              name={opt.icon}
              size={17}
              color={
                isSelected
                  ? colors.tint
                  : isDark
                  ? "#64748B"
                  : "#94A3B8"
              }
            />
            <Text
              style={[
                styles.label,
                {
                  color: isSelected
                    ? colors.text
                    : isDark
                    ? "#94A3B8"
                    : "#64748B",
                  fontWeight: isSelected ? "700" : "500",
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  optionActive: {
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 13,
  },
});
