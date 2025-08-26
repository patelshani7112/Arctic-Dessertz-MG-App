import * as React from "react";
import { ActivityIndicator, ScrollView, Text, TextInput, View, Pressable,Platform } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Me, Users, type RoleKey, type EmploymentRecord, type UserDetail, API_BASE, toUrl, apiGet } from "../lib/api";

/* ───────── Toast ───────── */
function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<NodeJS.Timeout | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 5000);
  };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setMsg(null); };
  const node = msg ? (
    <View style={{ position: "absolute", top: 16, right: 16, zIndex: 1000 }}>
      <View style={{ borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "white", paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text>✅</Text>
        <Text style={{ color: "#111" }}>{msg}</Text>
        <Text onPress={hide} style={{ marginLeft: 8, color: "#6b7280" }}>✕</Text>
      </View>
    </View>
  ) : null;
  return { show, node };
}

/* ───────── UI bits ───────── */
function Section(props: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "white" }}>
      <View style={{ height: 4, backgroundColor: "#365cf5" }} />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 10 }}>{props.title}</Text>
        <View style={{ gap: 10 }}>{props.children}</View>
      </View>
    </View>
  );
}

function LabeledInput(props: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600", color: "#111827" }}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        keyboardType={props.keyboardType}
        style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
      />
    </View>
  );
}

/* ───────── Debug bar to surface issues on-device ───────── */
function DebugBar({ meError, detailError }: { meError?: Error | null; detailError?: Error | null }) {
  const [health, setHealth] = React.useState<string>("checking…");
  const [meRaw, setMeRaw] = React.useState<string>("(tap Check)");

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch(toUrl("/health"));
        const t = await r.text();
        setHealth(`${r.status} ${t.slice(0, 100)}`);
      } catch (e: any) {
        setHealth(`ERR ${String(e).slice(0, 100)}`);
      }
    })();
  }, []);

  const checkMe = async () => {
    try {
      const json = await apiGet<any>("/v1/me", { timeoutMs: 8000 });
      setMeRaw(JSON.stringify(json, null, 2));
    } catch (e: any) {
      setMeRaw(`ERR ${e?.message || String(e)}`);
    }
  };

  return (
    <View style={{ marginTop: 12, borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 10 }}>
      <Text style={{ fontWeight: "700" }}>Debug</Text>
      <Text>API_BASE: {API_BASE}</Text>
      <Text>Health: {health}</Text>
      {meError ? <Text style={{ color: "#b91c1c" }}>me error: {meError.message}</Text> : null}
      {detailError ? <Text style={{ color: "#b91c1c" }}>detail error: {detailError.message}</Text> : null}
      <Pressable onPress={checkMe} style={{ marginTop: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: "#ddd", borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
        <Text>Check /v1/me</Text>
      </Pressable>
      <Text selectable style={{ marginTop: 6, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", fontSize: 12 }}>
        {meRaw}
      </Text>
    </View>
  );
}

/* ───────── Screen ───────── */
export default function ProfileScreen() {
  const qc = useQueryClient();
  const toast = useToast();

  // 1) Who am I?
  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get, retry: 1 });

  // 2) Personal profile (enabled after /v1/me succeeds)
  const detailQ = useQuery<UserDetail>({
    queryKey: ["me:detail", meQ.data?.user_id],
    queryFn: () => Users.get(meQ.data!.user_id),
    enabled: !!meQ.data?.user_id,
    retry: 1,
  });

  // 3) Employment (treat 404 as "none", not a hard error)
  const employmentQ = useQuery<EmploymentRecord[]>({
    queryKey: ["me:employment", meQ.data?.user_id],
    queryFn: async () => {
      try {
        // @ts-ignore optional helper; if you didn’t add Users.getEmployment just return []
        // return await Users.getEmployment(meQ.data!.user_id);
        return [] as EmploymentRecord[];
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("[404]")) return [];
        throw e;
      }
    },
    enabled: !!meQ.data?.user_id,
    retry: 0,
  });

  const [personal, setPersonal] = React.useState({
    first_name: "", last_name: "", phone: "", date_of_birth: "", gender: "",
    address: { street: "", city: "", state: "", postal_code: "", country: "" },
    emergency: { name: "", relation: "", phone: "", notes: "" },
  });

  React.useEffect(() => {
    const d = detailQ.data;
    if (!d) return;
    const addr = d.address_json ?? ({} as any);
    const emg = d.emergency_contact_json ?? ({} as any);
    setPersonal({
      first_name: (d as any).first_name ?? "",
      last_name: (d as any).last_name ?? "",
      phone: (d as any).phone ?? "",
      date_of_birth: (d as any).date_of_birth ?? "",
      gender: (d as any).gender ?? "",
      address: {
        street: addr.street ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        postal_code: addr.postal_code ?? "",
        country: addr.country ?? "",
      },
      emergency: {
        name: emg.name ?? "",
        relation: emg.relation ?? "",
        phone: emg.phone ?? "",
        notes: emg.notes ?? "",
      },
    });
  }, [detailQ.data]);

  const savePersonal = useMutation({
    mutationFn: async () => {
      const b = personal;
      const some = (o: Record<string, unknown>) => Object.values(o).some((v) => String(v ?? "").trim());
      // If you added Users.update to your API, call it here:
      // return Users.update(meQ.data!.user_id, {
      //   first_name: b.first_name || undefined,
      //   last_name: b.last_name || undefined,
      //   phone: b.phone || undefined,
      //   date_of_birth: b.date_of_birth || undefined,
      //   gender: b.gender || undefined,
      //   address_json: some(b.address) ? b.address : undefined,
      //   emergency_contact_json: some(b.emergency) ? b.emergency : undefined,
      // });
      return {} as any;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me:detail"] });
      toast.show("Personal info updated");
    },
    onError: (err: any) => toast.show(`⚠️ ${err?.message || "Failed to update personal info"}`),
  });

  const isLoading = meQ.isLoading || (meQ.data?.user_id && detailQ.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  /* ——— Error states ——— */
  if (meQ.isError) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Can’t load your profile</Text>
        <Text style={{ color: "#b91c1c" }}>{(meQ.error as Error).message}</Text>
        <DebugBar meError={meQ.error as Error} detailError={null} />
      </ScrollView>
    );
  }

  if (detailQ.isError) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Can’t load details</Text>
        <Text style={{ color: "#b91c1c" }}>{(detailQ.error as Error).message}</Text>
        <DebugBar meError={null} detailError={detailQ.error as Error} />
      </ScrollView>
    );
  }

  const assignments = (detailQ.data?.assignments ?? []) as {
    location_id: string; location_name: string; role_key: RoleKey;
  }[];
  const employment = (employmentQ.data ?? []) as EmploymentRecord[];

  return (
    <View style={{ flex: 1 }}>
      {toast.node}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: "700" }}>My Profile</Text>
          <Text style={{ color: "#6b7280", marginTop: 4 }}>
            Manage your personal info. Professional details are read-only.
          </Text>
        </View>

        {/* Personal (editable) */}
        <Section title="Personal information">
          <View style={{ gap: 12 }}>
            <LabeledInput label="First name" value={personal.first_name} onChangeText={(v) => setPersonal({ ...personal, first_name: v })} />
            <LabeledInput label="Last name" value={personal.last_name} onChangeText={(v) => setPersonal({ ...personal, last_name: v })} />
            <LabeledInput label="Phone" value={personal.phone} onChangeText={(v) => setPersonal({ ...personal, phone: v })} keyboardType="phone-pad" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Date of birth (YYYY-MM-DD)" value={personal.date_of_birth} onChangeText={(v) => setPersonal({ ...personal, date_of_birth: v })} placeholder="1999-12-31" />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Gender (optional)" value={personal.gender} onChangeText={(v) => setPersonal({ ...personal, gender: v })} />
              </View>
            </View>

            {/* Address */}
            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Address (optional)</Text>
            <LabeledInput label="Street" value={personal.address.street} onChangeText={(v) => setPersonal({ ...personal, address: { ...personal.address, street: v } })} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="City" value={personal.address.city} onChangeText={(v) => setPersonal({ ...personal, address: { ...personal.address, city: v } })} />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="State" value={personal.address.state} onChangeText={(v) => setPersonal({ ...personal, address: { ...personal.address, state: v } })} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Postal code" value={personal.address.postal_code} onChangeText={(v) => setPersonal({ ...personal, address: { ...personal.address, postal_code: v } })} />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Country" value={personal.address.country} onChangeText={(v) => setPersonal({ ...personal, address: { ...personal.address, country: v } })} />
              </View>
            </View>

            {/* Emergency */}
            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Emergency contact (optional)</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Name" value={personal.emergency.name} onChangeText={(v) => setPersonal({ ...personal, emergency: { ...personal.emergency, name: v } })} />
              </View>
              <View style={{ flex: 1 }}>
                <LabeledInput label="Relationship" value={personal.emergency.relation} onChangeText={(v) => setPersonal({ ...personal, emergency: { ...personal.emergency, relation: v } })} />
              </View>
            </View>
            <LabeledInput label="Phone" value={personal.emergency.phone} onChangeText={(v) => setPersonal({ ...personal, emergency: { ...personal.emergency, phone: v } })} keyboardType="phone-pad" />
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600", color: "#111827" }}>Notes</Text>
              <TextInput
                value={personal.emergency.notes}
                onChangeText={(v) => setPersonal({ ...personal, emergency: { ...personal.emergency, notes: v } })}
                placeholder="Notes"
                multiline
                style={{ height: 100, textAlignVertical: "top", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, paddingTop: 4, alignItems: "center" }}>
              <Pressable
                onPress={() => savePersonal.mutate()}
                disabled={savePersonal.isPending || !meQ.data?.user_id}
                style={{ opacity: savePersonal.isPending || !meQ.data?.user_id ? 0.6 : 1, backgroundColor: "#111827", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 }}
              >
                <Text style={{ color: "white", fontWeight: "700" }}>
                  {savePersonal.isPending ? "Saving..." : "Save personal info"}
                </Text>
              </Pressable>
              {savePersonal.isPending ? <ActivityIndicator /> : null}
            </View>
          </View>
        </Section>

        {/* Professional (read-only) */}
        <Section title="Professional details">
          <View style={{ gap: 12 }}>
            {(assignments || []).length === 0 ? (
              <Text style={{ color: "#6b7280" }}>You don’t have any location assignments yet.</Text>
            ) : (
              assignments.map((a) => {
                const row = employment.find((e) => e.location_id === a.location_id);
                return (
                  <View key={a.location_id} style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12 }}>
                    <Text style={{ fontWeight: "700" }}>{a.location_name}</Text>
                    <View style={{ marginTop: 6, gap: 4 }}>
                      <Text>Role: <Text style={{ fontWeight: "600" }}>{a.role_key}</Text></Text>
                      <Text>Employment type: <Text style={{ fontWeight: "600" }}>{row?.employment_type || "—"}</Text></Text>
                      <Text>Position: <Text style={{ fontWeight: "600" }}>{row?.position_title || "—"}</Text></Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Section>

        {/* Debug */}
        <DebugBar meError={null} detailError={null} />
      </ScrollView>
    </View>
  );
}
