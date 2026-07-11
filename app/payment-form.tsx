import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { usePayments } from "@/contexts/PaymentContext";
import { useTenants } from "@/contexts/TenantContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

const statuses = ["paid", "unpaid", "overdue", "partial"] as const;

export default function PaymentFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addPayment, updatePayment, getPayment } = usePayments();
  const { tenants, updateTenant } = useTenants();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isEditing = !!id;
  const existing = id ? getPayment(id) : undefined;

  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [shopNumber, setShopNumber] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [paymentMonth, setPaymentMonth] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [remainingBalance, setRemainingBalance] = useState("");
  const [fine, setFine] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("unpaid");

  useEffect(() => {
    if (existing) {
      setSelectedTenantId(existing.tenantId);
      setTenantName(existing.tenantName);
      setShopNumber(existing.shopNumber);
      setMonthlyRent(existing.monthlyRent.toString());
      setPaymentMonth(existing.paymentMonth);
      setDueDate(existing.dueDate);
      setPaymentDate(existing.paymentDate);
      setAmountPaid(existing.amountPaid.toString());
      setRemainingBalance(existing.remainingBalance.toString());
      setFine(existing.fine.toString());
      setNotes(existing.notes);
      setStatus(existing.status);
    }
  }, [existing]);

  const unpaidTenants = useMemo(
    () => tenants.filter((t) => !t.paid),
    [tenants],
  );

  const handleSelectTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setSelectedTenantId(tenant.id);
      setTenantName(tenant.fullName);
      setShopNumber(tenant.shopNumber);
      setMonthlyRent(tenant.rentAmount.toString());
      setDueDate(tenant.dueDate);
      setAmountPaid(tenant.rentAmount.toString());
      setRemainingBalance("0");
    }
  };

  async function handleSave() {
    if (!selectedTenantId) {
      Alert.alert("Required", "Please select a tenant.");
      return;
    }
    if (!paymentMonth.trim()) {
      Alert.alert("Required", "Please enter the payment month.");
      return;
    }

    const parsedAmount = Number(amountPaid) || 0;
    const parsedRent = Number(monthlyRent) || 0;
    const parsedRemaining = Number(remainingBalance) || 0;
    const parsedFine = Number(fine) || 0;

    const base = {
      tenantId: selectedTenantId,
      tenantName: tenantName.trim(),
      shopNumber: shopNumber.trim(),
      monthlyRent: parsedRent,
      paymentMonth: paymentMonth.trim(),
      dueDate: dueDate.trim(),
      paymentDate: paymentDate.trim(),
      amountPaid: parsedAmount,
      remainingBalance: parsedRemaining,
      fine: parsedFine,
      notes: notes.trim(),
      status: status as PaymentFormStatus,
    };

    if (isEditing && id) {
      await updatePayment(id, base);
    } else {
      await addPayment(base);
    }

    if (status === "paid" && selectedTenantId) {
      await updateTenant(selectedTenantId, { paid: true, lastPaymentDate: new Date().toISOString() });
    }

    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{ title: isEditing ? "Edit Payment" : "Record Payment" }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Tenant</ThemedText>
            {isEditing ? (
              <InputField
                label="Tenant Name"
                value={tenantName}
                onChangeText={setTenantName}
                colors={colors}
                colorScheme={colorScheme}
              />
            ) : (
              <View style={styles.tenantPicker}>
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Select Tenant",
                      "Choose a tenant for this payment",
                      [
                        ...unpaidTenants.map((t) => ({
                          text: `${t.fullName} (Shop ${t.shopNumber})`,
                          onPress: () => handleSelectTenant(t.id),
                        })),
                        { text: "Cancel" },
                      ],
                    );
                  }}
                  style={[
                    styles.pickerButton,
                    {
                      borderColor: colors.icon,
                      backgroundColor:
                        colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
                    },
                  ]}
                >
                  <ThemedText
                    style={
                      selectedTenantId
                        ? styles.pickerText
                        : styles.pickerPlaceholder
                    }
                  >
                    {selectedTenantId
                      ? `${tenantName} (Shop ${shopNumber})`
                      : "Tap to select a tenant..."}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Payment Details
            </ThemedText>
            <InputField
              label="Shop Number"
              value={shopNumber}
              onChangeText={setShopNumber}
              placeholder="e.g. A101"
              colors={colors}
              colorScheme={colorScheme}
              editable={false}
            />
            <InputField
              label="Monthly Rent (ETB)"
              value={monthlyRent}
              onChangeText={setMonthlyRent}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Payment Month (YYYY-MM)"
              value={paymentMonth}
              onChangeText={setPaymentMonth}
              placeholder="e.g. 2026-07"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="Due Date (YYYY-MM-DD)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="e.g. 2026-07-10"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="Payment Date (YYYY-MM-DD)"
              value={paymentDate}
              onChangeText={setPaymentDate}
              placeholder="e.g. 2026-07-05"
              colors={colors}
              colorScheme={colorScheme}
              autoCapitalize="none"
            />
            <InputField
              label="Amount Paid (ETB)"
              value={amountPaid}
              onChangeText={setAmountPaid}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Remaining Balance (ETB)"
              value={remainingBalance}
              onChangeText={setRemainingBalance}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Fine / Late Fee (ETB)"
              value={fine}
              onChangeText={setFine}
              placeholder="0.00"
              colors={colors}
              colorScheme={colorScheme}
              keyboardType="numeric"
            />
            <InputField
              label="Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional notes..."
              colors={colors}
              colorScheme={colorScheme}
              multiline
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Status</ThemedText>
            <View style={styles.statusGrid}>
              {statuses.map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.statusOption,
                    {
                      backgroundColor:
                        status === s
                          ? status === "paid"
                            ? "#4CAF50"
                            : status === "unpaid"
                              ? "#9E9E9E"
                              : status === "overdue"
                                ? "#E53935"
                                : "#FB8C00"
                          : colorScheme === "dark"
                            ? "#2c2c2e"
                            : "#f0f0f0",
                    },
                  ]}
                  onPress={() => setStatus(s)}
                >
                  <ThemedText
                    style={[
                      styles.statusOptionText,
                      {
                        color: status === s ? "#fff" : colors.text,
                        fontWeight: status === s ? "700" : "400",
                      },
                    ]}
                  >
                    {s === "paid"
                      ? "Paid"
                      : s === "unpaid"
                        ? "Unpaid"
                        : s === "overdue"
                          ? "Overdue"
                          : "Partial"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
          >
            <ThemedText style={styles.saveButtonText}>
              {isEditing ? "Update Payment" : "Record Payment"}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  colorScheme,
  keyboardType,
  autoCapitalize,
  multiline,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  colors: any;
  colorScheme: string | null | undefined;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
  editable?: boolean;
}) {
  return (
    <View style={fieldStyles.group}>
      <ThemedText style={fieldStyles.label}>{label}</ThemedText>
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.textArea,
          !editable && fieldStyles.readOnly,
          {
            color: colors.text,
            borderColor: colors.icon,
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#f5f5f5",
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={colors.icon}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        editable={editable ?? true}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  readOnly: {
    opacity: 0.6,
  },
});

type PaymentFormStatus = "paid" | "unpaid" | "overdue" | "partial";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  tenantPicker: {
    gap: 4,
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 16,
    fontWeight: "500",
  },
  pickerPlaceholder: {
    fontSize: 16,
    opacity: 0.4,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
  },
  statusOptionText: {
    fontSize: 14,
    textTransform: "capitalize",
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});
