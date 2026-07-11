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

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!token.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token.trim().toUpperCase(), newPassword);
      Alert.alert("Success", "Your password has been reset.", [
        { text: "Sign In", onPress: () => {} },
      ]);
    } catch (e: unknown) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: "Reset Password" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title" style={styles.title}>
            Enter Reset Token
          </ThemedText>
          <ThemedText style={styles.description}>
            Enter the token sent to your email and choose a new password.
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Reset Token</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="Enter reset token"
                placeholderTextColor={colors.icon}
                value={token}
                onChangeText={setToken}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>New Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="Enter new password"
                placeholderTextColor={colors.icon}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.icon,
                    backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                  },
                ]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.icon}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleReset}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? "Resetting..." : "Reset Password"}
              </ThemedText>
            </Pressable>

            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.linkButton}>
                <ThemedText type="link">Back to Sign In</ThemedText>
              </Pressable>
            </Link>
          </View>
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
});
