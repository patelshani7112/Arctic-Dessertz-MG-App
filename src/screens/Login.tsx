import * as React from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy;

  async function onSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      Alert.alert("Sign in failed", error);
    }
    // on success, AuthProvider switches to "signedIn" and RootNavigator shows Dashboard.
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 18 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", textAlign: "center" }}>Welcome back</Text>
        <Text style={{ textAlign: "center", color: "#666" }}>Sign in to your restaurant account</Text>

        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "600" }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="you@example.com"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              padding: 12,
            }}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: "600" }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            placeholder="••••••••"
            style={{
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 10,
              padding: 12,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            backgroundColor: canSubmit ? "#111" : "#999",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>{busy ? "Signing in..." : "Sign in"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
