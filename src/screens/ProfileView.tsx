import * as React from "react";
import { ActivityIndicator, ScrollView, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { MaterialIcons } from "@expo/vector-icons";

import { Me, Users, type UserDetail, type RoleKey, type EmploymentRecord } from "../lib/api";

/* ─── theme ─── */
const COLORS = {
  bg: "#f7f8fb",
  text: "#111827",
  muted: "#6b7280",
  card: "#ffffff",
  line: "#e5e7eb",
};

function Card({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, overflow: "hidden", backgroundColor: COLORS.card }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>{title}</Text>
        <View style={{ gap: 12 }}>{children}</View>
      </View>
    </View>
  );
}

/** Read-only field: label (top) + boxed value below */
function ReadonlyField({ label, value }: { label: string; value?: string | null }) {
  const v = value && String(value).trim() ? String(value) : "—";
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600", color: COLORS.text }}>{label}</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#fff",
          minHeight: 44,
          justifyContent: "center",
        }}
      >
        <Text numberOfLines={1} style={{ color: COLORS.text, fontWeight: "600" }}>
          {v}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileView() {
  const nav = useNavigation();

  // Who am I?
  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });

  // Full personal profile (+ assignments)
  const detailQ = useQuery<UserDetail>({
    queryKey: ["me:detail", meQ.data?.user_id],
    queryFn: () => Users.get(meQ.data!.user_id),
    enabled: !!meQ.data?.user_id,
  });

  // (Optional) Employment; keep empty if not implemented on API yet
  const employmentQ = useQuery<EmploymentRecord[]>({
    queryKey: ["me:employment", meQ.data?.user_id],
    queryFn: async () => [] as EmploymentRecord[],
    enabled: !!meQ.data?.user_id,
  });

  // Header: Edit button to go to edit screen
  React.useLayoutEffect(() => {
    (nav as any).setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => (nav as any).navigate("ProfileEdit")}
          style={{ paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <MaterialIcons name="edit" size={20} />
        </Pressable>
      ),
    });
  }, [nav]);

  if (meQ.isLoading || (meQ.data?.user_id && detailQ.isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (meQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(meQ.error as Error).message}</Text>;
  if (detailQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(detailQ.error as Error).message}</Text>;

  const d = detailQ.data as any;
  const assignments = (d?.assignments || []) as {
    location_id: string;
    location_name: string;
    role_key: RoleKey;
  }[];
  const employment = (employmentQ.data || []) as EmploymentRecord[];

  return (
    <ScrollView contentContainerStyle={{ backgroundColor: COLORS.bg, padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* No blue hero header — removed as requested */}

      {/* Personal info (labels + boxed values, like edit but read-only) */}
      <Card title="Personal information">
        <ReadonlyField label="First name" value={d?.first_name} />
        <ReadonlyField label="Last name" value={d?.last_name} />
        <ReadonlyField label="Email" value={meQ.data?.email} />
        <ReadonlyField label="Phone" value={d?.phone} />
        <ReadonlyField label="Date of birth" value={d?.date_of_birth} />
        <ReadonlyField label="Gender" value={d?.gender} />

        <ReadonlyField label="Street" value={d?.address_json?.street} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="City" value={d?.address_json?.city} />
          </View>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="State" value={d?.address_json?.state} />
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="Postal code" value={d?.address_json?.postal_code} />
          </View>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="Country" value={d?.address_json?.country} />
          </View>
        </View>

        <ReadonlyField label="Emergency name" value={d?.emergency_contact_json?.name} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="Relationship" value={d?.emergency_contact_json?.relation} />
          </View>
          <View style={{ flex: 1 }}>
            <ReadonlyField label="Emergency phone" value={d?.emergency_contact_json?.phone} />
          </View>
        </View>
        <ReadonlyField label="Notes" value={d?.emergency_contact_json?.notes} />
      </Card>

      {/* Professional (read-only summary) */}
      <Card title="Professional details">
        {assignments.length === 0 ? (
          <Text style={{ color: COLORS.muted }}>You don’t have any location assignments yet.</Text>
        ) : (
          assignments.map((a) => {
            const row = employment.find((e) => e.location_id === a.location_id);
            return (
              <View key={a.location_id} style={{ borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 12 }}>
                <Text style={{ fontWeight: "700", marginBottom: 6 }}>{a.location_name}</Text>
                <View style={{ gap: 6 }}>
                  <ReadonlyField label="Role" value={a.role_key} />
                  <ReadonlyField label="Employment type" value={row?.employment_type || "—"} />
                  <ReadonlyField label="Position" value={row?.position_title || "—"} />
                </View>
              </View>
            );
          })
        )}
      </Card>
    </ScrollView>
  );
}
