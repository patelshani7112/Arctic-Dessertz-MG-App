import * as React from "react";
import "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaView, StatusBar } from "react-native";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/providers/AuthProvider";
import { ActiveLocationProvider } from "./src/lib/activeLocation";

const qc = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        {/* ActiveLocation only matters once signed in; wrapping it here is fine
            because the protected Dashboard is the only place that uses it. */}
        <ActiveLocationProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <StatusBar />
            <RootNavigator />
          </SafeAreaView>
        </ActiveLocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
