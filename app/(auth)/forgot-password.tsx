import { Link, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!emailOrUsername.trim()) {
      Alert.alert("Error", "Please enter your email or username.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(emailOrUsername.trim());
      setSent(true);
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Forgot Password" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={true}
        >
          <ThemedText type="title" style={styles.title}>
            Reset Password
          </ThemedText>
          <ThemedText style={styles.description}>
            {"Enter your email or username and we'll send you a reset token."}
          </ThemedText>

          {!sent ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Email or Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.icon,
                      backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                  placeholder="Enter email or username"
                  placeholderTextColor={colors.icon}
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <ThemedText style={styles.buttonText}>
                  {loading ? "Sending..." : "Send Reset Token"}
                </ThemedText>
              </Pressable>

              <Link href="/(auth)/login" asChild>
                <Pressable style={styles.linkButton}>
                  <ThemedText type="link">Back to Sign In</ThemedText>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.sentContainer}>
              <ThemedText style={styles.sentText}>
                A reset token has been generated. Please check your email or use
                the token below to reset your password.
              </ThemedText>
              <Link href="/(auth)/reset-password" asChild>
                <Pressable style={[styles.button, { backgroundColor: colors.tint }]}>
                  <ThemedText style={styles.buttonText}>
                    Enter Reset Token
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
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
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.6,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sentContainer: {
    gap: 20,
    alignItems: "center",
  },
  sentText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 22,
  },
});
