

// apps/mobile/src/navigation/AppNavigator.tsx
import * as React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  FlatList,
  Dimensions,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../providers/AuthProvider";
import { useActiveLocation } from "../lib/activeLocation";
import { namePartsFromUser } from "../lib/name";
import Avatar from "../components/Avatar";
import { Me, Users, type UserDetail, type RoleKey } from "../lib/api";

import DashboardScreen from "../screens/Dashboard";
import UsersScreen from "../screens/Users";
import LocationsScreen from "../screens/Locations";
import ProfileView from "../screens/ProfileView";
import ProfileEdit from "../screens/ProfileEdit";

/* ---------------- helpers ---------------- */
function initialsFromFirstLast(first?: string | null, last?: string | null, fallback?: string) {
  const a = (first || "").trim();
  const b = (last || "").trim();
  if (a || b) return ((a[0] || "") + (b[0] || "")).toUpperCase() || (fallback ?? "?");
  return (fallback ?? "?").toUpperCase();
}
const humanRole = (r?: RoleKey | null) =>
  r ? r.charAt(0) + r.slice(1).toLowerCase() : "";

/* ---------------- permissions (strict, active-location driven) ---------------- */
function useMobilePermissions() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const { myLocations = [], activeId } = useActiveLocation();

  const isAdmin = !!me?.is_global_admin;

  // Only trust roles from /v1/my/locations
  const roleAtActive: RoleKey | null =
    activeId ? (myLocations.find((l) => l.id === activeId)?.my_role ?? null) : null;

  const isManagerAtActive = roleAtActive === "MANAGER";

  // “All locations” (no active) ⇒ only Admin keeps privileges
  const canUsers = isAdmin || isManagerAtActive;
  const canLocations = isAdmin || isManagerAtActive;

  return { isAdmin, roleAtActive, isManagerAtActive, canUsers, canLocations };
}

type Option = { value: string; label: string };

/* ---------------- custom Active Location selector (modal) ---------------- */
function LocationSelect() {
  const { activeId, setActiveId, myLocations, isAdmin, loading } = useActiveLocation();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  // Build labels like: "Downtown (Manager) • Front-of-house"
  const options = React.useMemo<Option[]>(() => {
    const base = myLocations.map((l) => {
      const role = humanRole(l.my_role);
      const pos = (l as any).position_title ? ` • ${(l as any).position_title}` : "";
      const roleChunk = role ? ` (${role})` : "";
      return { value: l.id, label: `${l.name}${roleChunk}${pos}` };
    });
    if (isAdmin) return [{ value: "", label: "All locations" }, ...base];
    return base.length ? base : [{ value: "", label: "No locations" }];
  }, [isAdmin, myLocations]);

  const selected = React.useMemo(
    () => options.find((o) => o.value === (activeId ?? "")) || options[0],
    [options, activeId]
  );

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [q, options]);

  const choose = (v: string) => {
    setActiveId(v === "" ? null : v);
    setOpen(false);
  };

  const sheetMaxH = Math.floor(Dimensions.get("window").height * 0.6);

  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>Active location</Text>

      <Pressable
        onPress={() => setOpen(true)}
        disabled={loading}
        style={{
          borderWidth: 1, borderColor: "#ddd", borderRadius: 10, backgroundColor: "#fff",
          paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, justifyContent: "center",
        }}
      >
        {loading ? (
          <View style={{ alignItems: "center" }}><ActivityIndicator /></View>
        ) : (
          <Text numberOfLines={2} ellipsizeMode="tail" style={{ fontWeight: "600" }}>
            {selected?.label || "Select…"}
          </Text>
        )}
      </Pressable>

      <Text style={{ color: "#6b7280", marginTop: 6, fontSize: 12 }}>
        This will centralize data across the app.
      </Text>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable onPress={() => setOpen(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
        <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: sheetMaxH }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>Choose location</Text>
            <Pressable
              onPress={() => setOpen(false)}
              style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 }}
            >
              <Text style={{ fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>

          <TextInput
            placeholder="Search locations…"
            value={q}
            onChangeText={setQ}
            style={{
              borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, backgroundColor: "#fff",
            }}
          />

          <FlatList
            data={filtered}
            keyExtractor={(o) => o.value || "ALL"}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = (activeId ?? "") === item.value;
              return (
                <Pressable
                  onPress={() => choose(item.value)}
                  style={{
                    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8,
                    backgroundColor: isSelected ? "#eef2ff" : "transparent",
                    flexDirection: "row", alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 18, height: 18, borderRadius: 999, borderWidth: 2,
                      borderColor: isSelected ? "#365cf5" : "#cbd5e1",
                      marginRight: 10, backgroundColor: isSelected ? "#365cf5" : "transparent",
                    }}
                  />
                  <Text style={{ flex: 1 }} numberOfLines={2} ellipsizeMode="tail">
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={<View style={{ paddingVertical: 16 }}><Text style={{ color: "#6b7280" }}>No matches.</Text></View>}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ---------------- drawer content ---------------- */
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const { user, signOut } = useAuth();

  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const detailQ = useQuery<UserDetail>({
    queryKey: ["me:detail", meQ.data?.user_id],
    queryFn: () => Users.get(meQ.data!.user_id),
    enabled: !!meQ.data?.user_id,
  });

  const metaName = namePartsFromUser(user);
  const first = detailQ.data?.first_name ?? metaName.first;
  const last  = detailQ.data?.last_name  ?? metaName.last;
  const initials = initialsFromFirstLast(first, last, metaName.initials);

  const goToProfile = React.useCallback(() => {
    navigation.getParent()?.navigate("Profile" as never);
  }, [navigation]);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      <Pressable
        onPress={goToProfile}
        style={{
          paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16,
          backgroundColor: "#f7f8fb", flexDirection: "row", alignItems: "center", gap: 12,
        }}
      >
        <Avatar initials={initials} size={44} />
        <View style={{ flexShrink: 1, minHeight: 44, justifyContent: "center" }}>
          <Text numberOfLines={1}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{first} </Text>
            <Text style={{ fontSize: 20, fontWeight: "800" }}>{last}</Text>
          </Text>
          {(meQ.isLoading || detailQ.isLoading) && (
            <View style={{ position: "absolute", right: -4, top: -4 }}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </Pressable>

      <View style={{ flex: 1, paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </View>

      <LocationSelect />

      <View style={{ borderTopWidth: 1, borderTopColor: "#eee", padding: 12 }}>
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          style={{ paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ fontWeight: "600" }}>Log out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

/* ---------------- navigators ---------------- */
type AppStackParamList = { Main: undefined; Profile: undefined; ProfileEdit: undefined };
const Stack = createNativeStackNavigator<AppStackParamList>();

type DrawerParamList = { Dashboard: undefined; Users: undefined; Locations: undefined };
const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
  const nav = useNavigation();
  const { activeId } = useActiveLocation();
  const { canUsers, canLocations } = useMobilePermissions();

  // Redirect away from restricted screens if your rights change
  React.useEffect(() => {
    const state: any = nav.getState?.();
    const routes: any[] = state?.routes ?? [];
    const current = routes[state?.index ?? 0]?.name as keyof DrawerParamList | undefined;
    if ((current === "Users" && !canUsers) || (current === "Locations" && !canLocations)) {
      // @ts-ignore
      nav.navigate("Dashboard");
    }
  }, [nav, canUsers, canLocations, activeId]);

  // Force rebuild of Drawer routes when gates change
  const drawerKey = React.useMemo(
    () => `drawer-${canUsers ? 1 : 0}-${canLocations ? 1 : 0}`,
    [canUsers, canLocations]
  );

  return (
    <Drawer.Navigator
      key={drawerKey}
      screenOptions={{ headerTitleAlign: "center" }}
      drawerContent={(p) => <CustomDrawerContent {...p} />}
      initialRouteName="Dashboard"
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      {canUsers && <Drawer.Screen name="Users" component={UsersScreen} />}
      {canLocations && <Drawer.Screen name="Locations" component={LocationsScreen} />}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileView} options={{ title: "Profile" }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEdit} options={{ title: "Edit profile" }} />
    </Stack.Navigator>
  );
}


