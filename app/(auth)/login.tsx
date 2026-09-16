import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ScalePressable } from "@/components/ui/scale-pressable";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, rememberedEmail } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  const [emailOrUsername, setEmailOrUsername] = useState(rememberedEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);
  const [loading, setLoading] = useState(false);

  const topInset = Math.max(insets.top, Platform.OS === "android" ? 24 : 0);

  async function handleLogin() {
    if (!emailOrUsername.trim() || !password.trim()) {
      Alert.alert("Required", "Please enter your username/email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(emailOrUsername.trim(), password, rememberMe);
    } catch (e: unknown) {
      Alert.alert("Login Failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Branded Hero Header */}
          <LinearGradient
            colors={
              isDark
                ? ["#0b1219", "#0e1722", "#132130"]
                : ["#0b1219", "#112032", "#193555"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroSection, { paddingTop: topInset + 20 }]}
          >
            <BrandLogo size="lg" />
            <Text style={styles.heroTitle}>RentalApp</Text>
            <Text style={styles.heroSubtitle}>
              Property & Tenant Management
            </Text>
          </LinearGradient>

          {/* Form Container */}
          <View style={styles.formSection}>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Welcome back
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Sign in to manage your rental properties
            </Text>

            <View style={styles.form}>
              {/* Username / Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Email or Username
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#151F32" : "#FFFFFF",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter email or username"
                    placeholderTextColor={colors.icon}
                    value={emailOrUsername}
                    onChangeText={setEmailOrUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: isDark ? "#151F32" : "#FFFFFF",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.icon}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter password"
                    placeholderTextColor={colors.icon}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.icon}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Options Row */}
              <View style={styles.optionsRow}>
                <Pressable
                  style={styles.rememberMeRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: rememberMe ? colors.tint : colors.border,
                        backgroundColor: rememberMe ? colors.tint : "transparent",
                      },
                    ]}
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[styles.rememberMeText, { color: colors.textSecondary }]}
                  >
                    Remember me
                  </Text>
                </Pressable>

                <Link href="/(auth)/forgot-password" asChild>
                  <Pressable hitSlop={8}>
                    <Text style={[styles.forgotText, { color: colors.tint }]}>
                      Forgot password?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              {/* Submit Button */}
              <ScalePressable
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </ScalePressable>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {"Don't have an account? "}
              </Text>
              <Link href="/(auth)/register" replace asChild>
                <Pressable hitSlop={12}>
                  <Text style={[styles.footerLink, { color: colors.tint }]}>
                    Sign Up
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontWeight: "500",
  },
  formSection: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
