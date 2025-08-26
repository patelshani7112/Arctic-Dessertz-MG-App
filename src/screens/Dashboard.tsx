import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { firstNameOf } from "../lib/name";

export default function DashboardScreen() {
  const { user, signOut } = useAuth();

  // Pull the name from user metadata if present, otherwise from email
  const firstName = firstNameOf(
    // Depending on how you store it, any of these keys may exist:
    (user?.user_metadata as any)?.first_name ||
      (user?.user_metadata as any)?.full_name ||
      (user?.user_metadata as any)?.name,
    user?.email ?? ""
  );

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 28, fontWeight: "800", textAlign: "center" }}>
        Hi, {firstName || "there"} 👋
      </Text>

      <Text style={{ textAlign: "center", color: "#666" }}>
        {user?.email}
      </Text>

      <TouchableOpacity
        onPress={signOut}
        style={{
          alignSelf: "center",
          marginTop: 24,
          paddingVertical: 10,
          paddingHorizontal: 16,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}
