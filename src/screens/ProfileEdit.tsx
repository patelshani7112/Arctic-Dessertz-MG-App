// import * as React from "react";
// import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View, Pressable } from "react-native";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useNavigation } from "@react-navigation/native";
// import { Me, Users, apiPatch, type UserDetail } from "../lib/api";

// function LabeledInput({
//   label, value, onChangeText, placeholder, keyboardType,
// }: {
//   label: string;
//   value: string;
//   onChangeText: (t: string) => void;
//   placeholder?: string;
//   keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
// }) {
//   return (
//     <View style={{ gap: 6 }}>
//       <Text style={{ fontWeight: "600", color: "#111827" }}>{label}</Text>
//       <TextInput
//         value={value}
//         onChangeText={onChangeText}
//         placeholder={placeholder}
//         keyboardType={keyboardType}
//         style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
//       />
//     </View>
//   );
// }

// export default function ProfileEdit() {
//   const nav = useNavigation();
//   const qc = useQueryClient();

//   // Me + current personal details
//   const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
//   const detailQ = useQuery<UserDetail>({
//     queryKey: ["me:detail", meQ.data?.user_id],
//     queryFn: () => Users.get(meQ.data!.user_id),
//     enabled: !!meQ.data?.user_id,
//   });

//   const [form, setForm] = React.useState({
//     first_name: "", last_name: "", phone: "", date_of_birth: "", gender: "",
//     street: "", city: "", state: "", postal_code: "", country: "",
//     emg_name: "", emg_relation: "", emg_phone: "", emg_notes: "",
//   });

//   React.useEffect(() => {
//     const d = detailQ.data as any;
//     if (!d) return;
//     setForm({
//       first_name: d.first_name ?? "",
//       last_name: d.last_name ?? "",
//       phone: d.phone ?? "",
//       date_of_birth: d.date_of_birth ?? "",
//       gender: d.gender ?? "",
//       street: d.address_json?.street ?? "",
//       city: d.address_json?.city ?? "",
//       state: d.address_json?.state ?? "",
//       postal_code: d.address_json?.postal_code ?? "",
//       country: d.address_json?.country ?? "",
//       emg_name: d.emergency_contact_json?.name ?? "",
//       emg_relation: d.emergency_contact_json?.relation ?? "",
//       emg_phone: d.emergency_contact_json?.phone ?? "",
//       emg_notes: d.emergency_contact_json?.notes ?? "",
//     });
//   }, [detailQ.data]);

//   const save = useMutation({
//     mutationFn: async () => {
//       // Build payload exactly like the web app
//       const address = { street: form.street, city: form.city, state: form.state, postal_code: form.postal_code, country: form.country };
//       const emergency = { name: form.emg_name, relation: form.emg_relation, phone: form.emg_phone, notes: form.emg_notes };

//       const some = (o: Record<string, unknown>) => Object.values(o).some((v) => String(v ?? "").trim().length > 0);

//       const body = {
//         first_name: form.first_name || undefined,
//         last_name: form.last_name || undefined,
//         phone: form.phone || undefined,
//         date_of_birth: form.date_of_birth || undefined,
//         gender: form.gender || undefined,
//         address_json: some(address) ? address : undefined,
//         emergency_contact_json: some(emergency) ? emergency : undefined,
//       };

//       // Use apiPatch directly so you don't need Users.update in api.ts
//       return apiPatch(`/v1/users/${meQ.data!.user_id}`, body);
//     },
//     onSuccess: async () => {
//       await Promise.all([
//         qc.invalidateQueries({ queryKey: ["me:detail"] }),
//       ]);
//       Alert.alert("Saved", "Personal info updated.");
//       (nav as any).goBack();
//     },
//     onError: (e: any) => Alert.alert("Update failed", e?.message || "Please try again"),
//   });

//   React.useLayoutEffect(() => {
//     (nav as any).setOptions({
//       headerRight: () => (
//         <Pressable
//           onPress={() => save.mutate()}
//           disabled={save.isPending || !meQ.data?.user_id}
//           style={{ opacity: save.isPending || !meQ.data?.user_id ? 0.6 : 1, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 }}
//         >
//           <Text style={{ fontWeight: "700" }}>{save.isPending ? "Saving…" : "Save"}</Text>
//         </Pressable>
//       ),
//     });
//   }, [nav, save.isPending, meQ.data?.user_id]);

//   if (meQ.isLoading || (meQ.data?.user_id && detailQ.isLoading)) {
//     return (
//       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   if (meQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(meQ.error as Error).message}</Text>;
//   if (detailQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(detailQ.error as Error).message}</Text>;

//   return (
//     <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
//       <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, overflow: "hidden", backgroundColor: "white" }}>
//         <View style={{ height: 4, backgroundColor: "#365cf5" }} />
//         <View style={{ padding: 16, gap: 12 }}>
//           <Text style={{ fontSize: 16, fontWeight: "700" }}>Personal information</Text>

//           <LabeledInput label="First name" value={form.first_name} onChangeText={(v) => setForm({ ...form, first_name: v })} />
//           <LabeledInput label="Last name"  value={form.last_name}  onChangeText={(v) => setForm({ ...form, last_name: v })} />
//           <LabeledInput label="Phone" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />

//           <View style={{ flexDirection: "row", gap: 12 }}>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Date of birth (YYYY-MM-DD)" value={form.date_of_birth} onChangeText={(v) => setForm({ ...form, date_of_birth: v })} placeholder="1999-12-31" />
//             </View>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Gender (optional)" value={form.gender} onChangeText={(v) => setForm({ ...form, gender: v })} />
//             </View>
//           </View>

//           <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Address (optional)</Text>
//           <LabeledInput label="Street" value={form.street} onChangeText={(v) => setForm({ ...form, street: v })} />
//           <View style={{ flexDirection: "row", gap: 12 }}>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="City" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="State" value={form.state} onChangeText={(v) => setForm({ ...form, state: v })} />
//             </View>
//           </View>
//           <View style={{ flexDirection: "row", gap: 12 }}>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Postal code" value={form.postal_code} onChangeText={(v) => setForm({ ...form, postal_code: v })} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Country" value={form.country} onChangeText={(v) => setForm({ ...form, country: v })} />
//             </View>
//           </View>

//           <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Emergency contact (optional)</Text>
//           <View style={{ flexDirection: "row", gap: 12 }}>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Name" value={form.emg_name} onChangeText={(v) => setForm({ ...form, emg_name: v })} />
//             </View>
//             <View style={{ flex: 1 }}>
//               <LabeledInput label="Relationship" value={form.emg_relation} onChangeText={(v) => setForm({ ...form, emg_relation: v })} />
//             </View>
//           </View>
//           <LabeledInput label="Phone" value={form.emg_phone} onChangeText={(v) => setForm({ ...form, emg_phone: v })} keyboardType="phone-pad" />
//           <View style={{ gap: 6 }}>
//             <Text style={{ fontWeight: "600", color: "#111827" }}>Notes</Text>
//             <TextInput
//               value={form.emg_notes}
//               onChangeText={(v) => setForm({ ...form, emg_notes: v })}
//               placeholder="Notes"
//               multiline
//               style={{ height: 100, textAlignVertical: "top", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
//             />
//           </View>
//         </View>
//       </View>
//     </ScrollView>
//   );
// }


import * as React from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MaterialIcons } from "@expo/vector-icons";

import { Me, Users, apiPatch, type UserDetail } from "../lib/api";

const LINE = "#e5e7eb";

function Field({ label, ...rest }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600", color: "#111827" }}>{label}</Text>
      <TextInput
        placeholderTextColor="#9ca3af"
        style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
        {...rest}
      />
    </View>
  );
}

export default function ProfileEdit() {
  const nav = useNavigation();
  const qc = useQueryClient();

  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const detailQ = useQuery<UserDetail>({
    queryKey: ["me:detail", meQ.data?.user_id],
    queryFn: () => Users.get(meQ.data!.user_id),
    enabled: !!meQ.data?.user_id,
  });

  const [f, setF] = React.useState({
    first_name: "", last_name: "", phone: "", date_of_birth: "", gender: "",
    street: "", city: "", state: "", postal_code: "", country: "",
    emg_name: "", emg_relation: "", emg_phone: "", emg_notes: "",
  });

  React.useEffect(() => {
    const d = detailQ.data as any;
    if (!d) return;
    setF({
      first_name: d.first_name ?? "",
      last_name: d.last_name ?? "",
      phone: d.phone ?? "",
      date_of_birth: d.date_of_birth ?? "",
      gender: d.gender ?? "",
      street: d.address_json?.street ?? "",
      city: d.address_json?.city ?? "",
      state: d.address_json?.state ?? "",
      postal_code: d.address_json?.postal_code ?? "",
      country: d.address_json?.country ?? "",
      emg_name: d.emergency_contact_json?.name ?? "",
      emg_relation: d.emergency_contact_json?.relation ?? "",
      emg_phone: d.emergency_contact_json?.phone ?? "",
      emg_notes: d.emergency_contact_json?.notes ?? "",
    });
  }, [detailQ.data]);

  const save = useMutation({
    mutationFn: async () => {
      const address = { street: f.street, city: f.city, state: f.state, postal_code: f.postal_code, country: f.country };
      const emergency = { name: f.emg_name, relation: f.emg_relation, phone: f.emg_phone, notes: f.emg_notes };
      const some = (o: Record<string, unknown>) => Object.values(o).some((v) => String(v ?? "").trim().length > 0);

      const body = {
        first_name: f.first_name || undefined,
        last_name: f.last_name || undefined,
        phone: f.phone || undefined,
        date_of_birth: f.date_of_birth || undefined,
        gender: f.gender || undefined,
        address_json: some(address) ? address : undefined,
        emergency_contact_json: some(emergency) ? emergency : undefined,
      };

      return apiPatch(`/v1/users/${meQ.data!.user_id}`, body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["me:detail"] });
      Alert.alert("Saved", "Personal info updated.");
      (nav as any).goBack();
    },
    onError: (e: any) => Alert.alert("Update failed", e?.message || "Please try again"),
  });

  // header: Save button
  React.useLayoutEffect(() => {
    (nav as any).setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => save.mutate()}
          disabled={save.isPending || !meQ.data?.user_id}
          style={{ opacity: save.isPending || !meQ.data?.user_id ? 0.6 : 1, paddingHorizontal: 10, paddingVertical: 6 }}
        >
          <MaterialIcons name="check" size={22} />
        </Pressable>
      ),
    });
  }, [nav, save.isPending, meQ.data?.user_id]);

  if (meQ.isLoading || (meQ.data?.user_id && detailQ.isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (meQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(meQ.error as Error).message}</Text>;
  if (detailQ.isError) return <Text style={{ padding: 16, color: "#b91c1c" }}>{(detailQ.error as Error).message}</Text>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: "padding", android: undefined })}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        {/* Personal */}
        <View style={{ borderWidth: 1, borderColor: LINE, borderRadius: 16, overflow: "hidden", backgroundColor: "#fff" }}>
          <View style={{ height: 4, backgroundColor: "#365cf5" }} />
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>Personal information</Text>

            <Field label="First name" value={f.first_name} onChangeText={(v) => setF({ ...f, first_name: v })} />
            <Field label="Last name"  value={f.last_name}  onChangeText={(v) => setF({ ...f, last_name: v })} />
            <Field label="Phone" value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} keyboardType="phone-pad" />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Date of birth (YYYY-MM-DD)" value={f.date_of_birth} onChangeText={(v) => setF({ ...f, date_of_birth: v })} placeholder="1999-12-31" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Gender (optional)" value={f.gender} onChangeText={(v) => setF({ ...f, gender: v })} />
              </View>
            </View>

            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Address (optional)</Text>
            <Field label="Street" value={f.street} onChangeText={(v) => setF({ ...f, street: v })} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={f.city} onChangeText={(v) => setF({ ...f, city: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State" value={f.state} onChangeText={(v) => setF({ ...f, state: v })} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Postal code" value={f.postal_code} onChangeText={(v) => setF({ ...f, postal_code: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Country" value={f.country} onChangeText={(v) => setF({ ...f, country: v })} />
              </View>
            </View>

            <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Emergency contact (optional)</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Field label="Name" value={f.emg_name} onChangeText={(v) => setF({ ...f, emg_name: v })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Relationship" value={f.emg_relation} onChangeText={(v) => setF({ ...f, emg_relation: v })} />
              </View>
            </View>
            <Field label="Phone" value={f.emg_phone} onChangeText={(v) => setF({ ...f, emg_phone: v })} keyboardType="phone-pad" />
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "600", color: "#111827" }}>Notes</Text>
              <TextInput
                value={f.emg_notes}
                onChangeText={(v) => setF({ ...f, emg_notes: v })}
                placeholder="Notes"
                multiline
                style={{ height: 100, textAlignVertical: "top", borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
              />
            </View>
          </View>
        </View>

        {/* Bottom action (secondary save) */}
        <Pressable
          onPress={() => save.mutate()}
          disabled={save.isPending || !meQ.data?.user_id}
          style={{
            opacity: save.isPending || !meQ.data?.user_id ? 0.6 : 1,
            backgroundColor: "#111827",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {save.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "white", fontWeight: "800" }}>Save changes</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
