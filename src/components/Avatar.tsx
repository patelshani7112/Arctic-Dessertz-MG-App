import * as React from "react";
import { View, Text } from "react-native";

export default function Avatar({
  initials,
  size = 40,
}: { initials: string; size?: number }) {
  const r = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: "#e8ecf7",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: size * 0.4, color: "#2b4de2" }}>
        {initials}
      </Text>
    </View>
  );
}
