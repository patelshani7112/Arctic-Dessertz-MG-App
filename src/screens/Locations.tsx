

// apps/mobile/src/screens/Locations.tsx
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import {
  apiGet,
  Locations,
  type ProfileMe,
  type Location,
  type HoursJson,
  type DayKey,
} from "../lib/api";
import { useActiveLocation } from "../lib/activeLocation";

/* ───────── constants ───────── */
const LINE = "#e5e7eb";
const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

/* ───────── helpers ───────── */
function defaultHours(): HoursJson {
  const base = { closed: false, intervals: [{ open: "", close: "" }] };
  return {
    mon: { ...base }, tue: { ...base }, wed: { ...base },
    thu: { ...base }, fri: { ...base }, sat: { ...base }, sun: { ...base },
  };
}
function normalizeHours(raw: any): HoursJson {
  const base = defaultHours();
  if (!raw || typeof raw !== "object") return base;
  const out: any = { ...base };
  (Object.keys(base) as DayKey[]).forEach((k) => {
    const v = raw[k];
    if (!v) return;
    const intervals = Array.isArray(v.intervals)
      ? v.intervals.map((x: any) => ({
          open: typeof x.open === "string" ? x.open : "",
          close: typeof x.close === "string" ? x.close : "",
        }))
      : [{ open: "", close: "" }];
    out[k] = { closed: !!v.closed, intervals: intervals.length ? intervals : [{ open: "", close: "" }] };
  });
  return out;
}
function hoursToJson(h: HoursJson) {
  const clean: any = {};
  (Object.keys(h) as DayKey[]).forEach((k) => {
    const d = h[k];
    clean[k] = { closed: !!d.closed, intervals: (d.intervals || []).filter((x) => x.open && x.close) };
  });
  return clean;
}
function prettyJson(v: any) {
  try { return v ? JSON.stringify(v, null, 2) : "{\n  \n}"; } catch { return "{\n  \n}"; }
}
function isPrinterJsonValid(txt: string) {
  try { const t = (txt || "").trim(); if (!t) return true; JSON.parse(t); return true; } catch { return false; }
}

/* ───────── tiny UI atoms ───────── */
function Input({
  label, value, onChangeText, placeholder, secure, keyboardType,
}:{
  label: string; value: string; onChangeText: (t:string)=>void; placeholder?: string;
  secure?: boolean; keyboardType?: "default"|"numeric"|"email-address"|"phone-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        style={{
          borderWidth: 1, borderColor: LINE, borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff",
        }}
      />
    </View>
  );
}
function Row({ left, right }:{ left: React.ReactNode; right: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ flex: 1 }}>{left}</View>
      <View style={{ flex: 1 }}>{right}</View>
    </View>
  );
}

/* ───────── Time picker: Android(native) / iOS(wheel modal) ───────── */
function TimePickerField({
  label, value, onChange, minuteStep = 5,
}:{
  label: string; value: string; onChange: (v: string) => void; minuteStep?: number;
}) {
  const [visible, setVisible] = React.useState(false);

  const parse = (v: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(v || "");
    const hh = m ? Math.min(23, Math.max(0, Number(m[1]))) : 8;
    const mm = m ? Math.min(59, Math.max(0, Number(m[2]))) : 0;
    return { hh, mm };
  };
  const fmt = (n: number) => (n < 10 ? `0${n}` : String(n));
  const roundToStep = (mins: number) => Math.min(59, Math.round(mins / minuteStep) * minuteStep);

  const { hh, mm } = parse(value);

  // iOS wheel state
  const [iosH, setIosH] = React.useState(hh);
  const [iosM, setIosM] = React.useState(mm - (mm % minuteStep));

  React.useEffect(() => {
    setIosH(hh);
    setIosM(mm - (mm % minuteStep));
  }, [value, visible]);

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = React.useMemo(
    () => Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep),
    [minuteStep]
  );

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={{
          borderWidth: 1, borderColor: LINE, borderRadius: 12,
          paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "600" }}>{value || "—"}</Text>
      </Pressable>

      {/* ANDROID: native dialog (safe inside RN Modal) */}
      {Platform.OS === "android" && visible && (
        <DateTimePicker
          value={new Date(2000, 0, 1, hh, mm)}
          mode="time"
          is24Hour
          display="spinner"
          onChange={(e: DateTimePickerEvent, d?: Date) => {
            if (e.type === "dismissed") { setVisible(false); return; }
            const H = d?.getHours() ?? hh;
            const M = d ? roundToStep(d.getMinutes()) : mm;
            onChange(`${fmt(H)}:${fmt(M)}`);
            setVisible(false);
          }}
        />
      )}

      {/* iOS: wheel modal with Pickers */}
      {Platform.OS === "ios" && (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          {/* backdrop */}
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} onPress={() => setVisible(false)}>
            <View />
          </Pressable>

          {/* bottom sheet */}
          <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{label}</Text>
              <Pressable
                onPress={() => { onChange(`${fmt(iosH)}:${fmt(iosM)}`); setVisible(false); }}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#ddd", borderRadius: 10 }}
              >
                <Text style={{ fontWeight: "700" }}>Done</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <Picker selectedValue={iosH} onValueChange={(v) => setIosH(Number(v))}>
                  {hours.map((H) => <Picker.Item key={H} label={fmt(H)} value={H} />)}
                </Picker>
              </View>

              <View style={{ flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                <Picker selectedValue={iosM} onValueChange={(v) => setIosM(Number(v))}>
                  {minutes.map((M) => <Picker.Item key={M} label={fmt(M)} value={M} />)}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

/* ───────── Hours editor (uses TimePickerField) ───────── */
function HoursEditor({
  value, onChange, error, submitted,
}:{
  value: HoursJson; onChange:(v:HoursJson)=>void; error?: string|null; submitted?: boolean;
}) {
  const setDay = (key: DayKey, upd: (d: any)=>any) =>
    onChange({ ...value, [key]: upd(value[key]) });

  return (
    <View style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12 }}>
      <View style={{ padding: 10, borderBottomWidth: 1, borderColor: LINE }}>
        <Text style={{ fontWeight: "700" }}>Opening hours</Text>
      </View>
      <View style={{ padding: 12, gap: 10 }}>
        {DAYS.map((d) => {
          const row = value[d.key] || { closed: false, intervals: [{ open: "", close: "" }] };
          return (
            <View key={d.key} style={{ gap: 6, backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "600" }}>{d.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text>Closed</Text>
                  <Switch
                    value={!!row.closed}
                    onValueChange={(v) =>
                      setDay(d.key, () => ({ closed: v, intervals: [{ open: "", close: "" }] }))
                    }
                  />
                </View>
              </View>
              {row.closed ? (
                <Text style={{ color: "#6b7280" }}>Closed</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {row.intervals.map((itv, idx) => (
                    <Row
                      key={idx}
                      left={
                        <TimePickerField
                          label="Open"
                          value={itv.open}
                          onChange={(t) =>
                            setDay(d.key, (old:any) => {
                              const next = [...old.intervals];
                              next[idx] = { ...next[idx], open: t };
                              return { ...old, intervals: next };
                            })
                          }
                          minuteStep={5}
                        />
                      }
                      right={
                        <TimePickerField
                          label="Close"
                          value={itv.close}
                          onChange={(t) =>
                            setDay(d.key, (old:any) => {
                              const next = [...old.intervals];
                              next[idx] = { ...next[idx], close: t };
                              return { ...old, intervals: next };
                            })
                          }
                          minuteStep={5}
                        />
                      }
                    />
                  ))}
                  <Pressable
                    onPress={() => setDay(d.key, (old:any) => ({ ...old, intervals: [...old.intervals, { open: "", close: "" }] }))}
                    style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
                  >
                    <Text>+ Add interval</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
        {submitted && !!error && <Text style={{ color: "#b91c1c" }}>{error}</Text>}
      </View>
    </View>
  );
}

/* ───────── Form helpers ───────── */
function validate(form: any) {
  const e: Record<string, string> = {};
  if (!String(form.name).trim()) e.name = "Name is required";
  if (!String(form.tz).trim()) e.tz = "Time zone is required";
  if (form.contact_email && !/^\S+@\S+\.\S+$/.test(form.contact_email)) e.contact_email = "Invalid email";
  if (form.latitude !== "" && isNaN(Number(form.latitude))) e.latitude = "Latitude must be a number";
  if (form.longitude !== "" && isNaN(Number(form.longitude))) e.longitude = "Longitude must be a number";
  if (form.geofence_meters !== "" && (isNaN(Number(form.geofence_meters)) || Number(form.geofence_meters) < 0))
    e.geofence_meters = "Geofence must be a non-negative number";

  let bad = false;
  (Object.keys(form.open_hours) as DayKey[]).forEach((k) => {
    const d = form.open_hours[k];
    if (!d.closed) {
      if (!d.intervals.length) bad = true;
      d.intervals.forEach((x: any) => { if (!x.open || !x.close) bad = true; });
    }
  });
  if (bad) e.hours = "Complete all open/close times or mark day as Closed.";
  return e;
}
function toPayload(form: any) {
  const addr: any = {};
  if (form.street) addr.street = form.street;
  if (form.city) addr.city = form.city;
  if (form.state) addr.state = form.state;
  if (form.postal_code) addr.postal_code = form.postal_code;
  if (form.country) addr.country = form.country;

  let printerConfig: any | undefined = undefined;
  try { const t = (form.printer_config_raw || "").trim(); if (t) printerConfig = JSON.parse(t); } catch {}

  return {
    name: String(form.name || "").trim(),
    brand_name: form.brand_name || undefined,
    tz: String(form.tz || "").trim(),
    address_json: Object.keys(addr).length ? addr : undefined,
    latitude: form.latitude !== "" ? Number(form.latitude) : undefined,
    longitude: form.longitude !== "" ? Number(form.longitude) : undefined,
    contact_phone: form.contact_phone || undefined,
    contact_email: form.contact_email || undefined,
    open_hours_json: hoursToJson(form.open_hours),
    geofence_meters: form.geofence_meters !== "" ? Number(form.geofence_meters) : undefined,
    printer_config_json: printerConfig,
    pos_external_id: form.pos_external_id || undefined,
    is_active: !!form.is_active,
  };
}

const blankForm = {
  name: "",
  brand_name: "",
  tz: "",
  contact_phone: "",
  contact_email: "",
  street: "",
  city: "",
  state: "",
  postal_code: "",
  country: "",
  latitude: "",
  longitude: "",
  geofence_meters: "",
  pos_external_id: "",
  is_active: true,
  open_hours: defaultHours(),
  printer_config_raw: "{\n  \n}",
};

/* ───────── Form modal ───────── */
function LocationFormModal({
  visible, onClose, onSubmit, initial, isSaving, allowDelete, onDelete,
}:{
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  initial?: Location | null;
  isSaving?: boolean;
  allowDelete?: boolean;
  onDelete?: () => void;
}) {
  const [form, setForm] = React.useState({ ...blankForm });
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    if (initial) {
      const a = (initial.address_json || {}) as any;
      setForm({
        name: initial.name || "",
        brand_name: initial.brand_name || "",
        tz: initial.tz || "",
        contact_email: (initial.contact_email as any) || "",
        contact_phone: (initial.contact_phone as any) || "",
        street: a.street || "",
        city: a.city || "",
        state: a.state || "",
        postal_code: a.postal_code || "",
        country: a.country || "",
        latitude: initial.latitude != null ? String(initial.latitude) : "",
        longitude: initial.longitude != null ? String(initial.longitude) : "",
        geofence_meters: initial.geofence_meters != null ? String(initial.geofence_meters) : "",
        pos_external_id: (initial.pos_external_id as any) || "",
        is_active: Boolean(initial.is_active ?? true),
        open_hours: normalizeHours(initial.open_hours_json),
        printer_config_raw: prettyJson(initial.printer_config_json),
      });
    } else {
      setForm({ ...blankForm });
    }
    setSubmitted(false);
  }, [initial, visible]);

  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  const trySubmit = () => {
    setSubmitted(true);
    if (!hasErrors && isPrinterJsonValid(form.printer_config_raw)) onSubmit(toPayload(form));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <Text style={{ fontSize: 18, fontWeight: "800" }}>
          {initial ? `Edit: ${initial.name}` : "Create location"}
        </Text>

        <Row
          left={
            <View>
              <Input label="Name *" value={form.name} onChangeText={(v)=>setForm({...form, name: v})}/>
              {submitted && errors.name && <Text style={{ color: "#b91c1c" }}>{errors.name}</Text>}
            </View>
          }
          right={<Input label="Brand (optional)" value={form.brand_name} onChangeText={(v)=>setForm({...form, brand_name: v})}/>}
        />

        <View>
          <Input label="Time zone * (e.g. America/Chicago)" value={form.tz} onChangeText={(v)=>setForm({...form, tz: v})}/>
          {submitted && errors.tz && <Text style={{ color: "#b91c1c" }}>{errors.tz}</Text>}
        </View>

        <Row
          left={<Input label="Contact phone" value={form.contact_phone} onChangeText={(v)=>setForm({...form, contact_phone: v})} keyboardType="phone-pad" />}
          right={
            <View>
              <Input label="Contact email" value={form.contact_email} onChangeText={(v)=>setForm({...form, contact_email: v})} keyboardType="email-address" />
              {submitted && errors.contact_email && <Text style={{ color: "#b91c1c" }}>{errors.contact_email}</Text>}
            </View>
          }
        />

        <View style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12 }}>
          <View style={{ padding: 10, borderBottomWidth: 1, borderColor: LINE }}>
            <Text style={{ fontWeight: "700" }}>Address</Text>
          </View>
          <View style={{ padding: 12, gap: 12 }}>
            <Row
              left={<Input label="Street" value={form.street} onChangeText={(v)=>setForm({...form, street: v})} />}
              right={<Input label="City"   value={form.city}   onChangeText={(v)=>setForm({...form, city: v})} />}
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Input label="State" value={form.state} onChangeText={(v)=>setForm({...form, state: v})} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Postal code" value={form.postal_code} onChangeText={(v)=>setForm({...form, postal_code: v})} />
              </View >
              <View style={{ flex: 1 }}>
                <Input label="Country" value={form.country} onChangeText={(v)=>setForm({...form, country: v})} />
              </View>
            </View>
          </View>
        </View>

        <Row
          left={
            <View>
              <Input label="Latitude" value={form.latitude} onChangeText={(v)=>setForm({...form, latitude: v})} keyboardType="numeric" />
              {submitted && errors.latitude && <Text style={{ color: "#b91c1c" }}>{errors.latitude}</Text>}
            </View>
          }
          right={
            <View>
              <Input label="Longitude" value={form.longitude} onChangeText={(v)=>setForm({...form, longitude: v})} keyboardType="numeric" />
              {submitted && errors.longitude && <Text style={{ color: "#b91c1c" }}>{errors.longitude}</Text>}
            </View>
          }
        />

        <Row
          left={
            <View>
              <Input label="Geofence meters (optional)" value={form.geofence_meters} onChangeText={(v)=>setForm({...form, geofence_meters: v})} keyboardType="numeric" />
              {submitted && errors.geofence_meters && <Text style={{ color: "#b91c1c" }}>{errors.geofence_meters}</Text>}
            </View>
          }
          right={<Input label="POS external ID (optional)" value={form.pos_external_id} onChangeText={(v)=>setForm({...form, pos_external_id: v})} />}
        />

        <HoursEditor value={form.open_hours} onChange={(v)=>setForm({...form, open_hours: v})} error={errors.hours} submitted={submitted} />

        <View style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12 }}>
          <View style={{ padding: 10, borderBottomWidth: 1, borderColor: LINE }}>
            <Text style={{ fontWeight: "700" }}>Printer config (JSON)</Text>
          </View>
          <View style={{ padding: 12 }}>
            <TextInput
              multiline
              value={form.printer_config_raw}
              onChangeText={(v)=>setForm({...form, printer_config_raw: v})}
              style={{ height: 120, fontFamily: "Courier", borderWidth: 1, borderColor: LINE, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
              placeholder='e.g. { "model": "Epson TM-T88", "dpi": 203 }'
            />
            {submitted && !isPrinterJsonValid(form.printer_config_raw) && (
              <Text style={{ color: "#b91c1c", marginTop: 6 }}>Printer config JSON is invalid.</Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Switch value={!!form.is_active} onValueChange={(v)=>setForm({...form, is_active: v})} />
          <Text>Active</Text>
        </View>

        {/* footer actions */}
        <View style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}>
          {allowDelete && onDelete && (
            <Pressable
              onPress={onDelete}
              style={{ paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
            >
              <Text>Delete…</Text>
            </Pressable>
          )}
          <Pressable
            onPress={onClose}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
          >
            <Text>Close</Text>
          </Pressable>
          <Pressable
            onPress={trySubmit}
            disabled={isSaving}
            style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#365cf5", opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700" }}>{initial ? "Save" : "Create"}</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </Modal>
  );
}

/* ───────── Main page (search-only; Create button moved to headerRight) ───────── */
export default function LocationsScreen() {
  const qc = useQueryClient();
  const nav = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { activeId, setActiveId, isAdmin } = useActiveLocation();

  // Who am I (optional)
  useQuery({ queryKey: ["me"], queryFn: () => apiGet<ProfileMe>("/v1/me") });

  // list
  const rowsQ = useQuery({ queryKey: ["locations"], queryFn: Locations.list });

  // search-only filter
  const [q, setQ] = React.useState("");

  // modal state
  const [open, setOpen] = React.useState<null | "create" | "edit">(null);
  const [editing, setEditing] = React.useState<Location | null>(null);
  const [loadingDetailId, setLoadingDetailId] = React.useState<string | null>(null);

  // put the "+ New Location" button in the screen header (top-right)
  React.useLayoutEffect(() => {
    nav.setOptions({
      headerTitle: "Locations",
      headerRight: () =>
        isAdmin ? (
          <Pressable
            onPress={() => setOpen("create")}
            style={{
              marginRight: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: "#365cf5",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>+ New</Text>
          </Pressable>
        ) : null,
    });
  }, [nav, isAdmin]);

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = rowsQ.data || [];
    if (!term) return rows;
    return rows.filter((l: Location) =>
      (l.name || "").toLowerCase().includes(term) ||
      (l.brand_name || "").toLowerCase().includes(term) ||
      (l.tz || "").toLowerCase().includes(term) ||
      (l.contact_email || "").toLowerCase().includes(term)
    );
  }, [rowsQ.data, q]);

  // mutations
  const invalidate = async () => qc.invalidateQueries({ queryKey: ["locations"] });
  const createMut = useMutation({
    mutationFn: (payload: any) => Locations.create(payload),
    onSuccess: async () => { setOpen(null); await invalidate(); },
    onError: (e: any) => Alert.alert("Create failed", e?.message || "Please try again"),
  });
  const updateMut = useMutation({
    mutationFn: (payload: any) => Locations.update(editing!.id, payload),
    onSuccess: async () => { setOpen(null); setEditing(null); await invalidate(); },
    onError: (e: any) => Alert.alert("Update failed", e?.message || "Please try again"),
  });
  const deleteMut = useMutation({
    mutationFn: () => Locations.delete(editing!.id),
    onSuccess: async () => { setOpen(null); setEditing(null); await invalidate(); },
    onError: (e: any) => Alert.alert("Delete failed", e?.message || "Please try again"),
  });

  const canEdit = (l: Location) => isAdmin || l.my_role === "MANAGER";

  const handleEdit = async (id: string) => {
    try {
      setLoadingDetailId(id);
      const fresh = await apiGet<Location>(`/v1/locations/${id}`);
      setEditing(fresh);
      setOpen("edit");
    } catch (e: any) {
      Alert.alert("Failed to load", e?.message || "Could not fetch location details");
    } finally {
      setLoadingDetailId(null);
    }
  };

  /* UI */
  return (
    <View style={{ flex: 1 }}>
      {/* Top search bar (no create button here anymore) */}
      <View style={{ padding: 12, gap: 8, borderBottomWidth: 1, borderColor: LINE, backgroundColor: "#fff" }}>
        <TextInput
          placeholder="Search name, brand, timezone, email…"
          value={q}
          onChangeText={setQ}
          style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" }}
        />
        <Text style={{ color: "#6b7280" }}>
          {rowsQ.isLoading ? "Loading…" : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      {/* List */}
      {rowsQ.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: "#6b7280" }}>No locations match your search.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item: l }) => {
            const isActive = activeId === l.id;
            const isLoadingThis = loadingDetailId === l.id;
            return (
              <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flexShrink: 1, gap: 2 }}>
                    <Text style={{ fontWeight: "800", fontSize: 16 }}>{l.name}</Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {l.my_role === "MANAGER" ? "You manage this location" : (l.brand_name || "—")}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>{l.tz}</Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {(l.contact_phone || "—") + " • " + (l.contact_email || "—")}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text
                      style={{
                        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                        borderWidth: 1, borderColor: l.is_active ? "#16a34a" : "#9ca3af",
                        color: l.is_active ? "#16a34a" : "#6b7280", fontSize: 12,
                      }}
                    >
                      {l.is_active ? "Active" : "Inactive"}
                    </Text>

                    {isActive ? (
                      <Text
                        style={{
                          paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                          borderWidth: 1, borderColor: "#365cf5", color: "#365cf5", fontSize: 12,
                        }}
                      >
                        Current
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => setActiveId(l.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#c7d2fe", borderRadius: 10, backgroundColor: "#eef2ff" }}
                      >
                        <Text>Set Active</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                  <Pressable
                    disabled={!canEdit(l) || isLoadingThis}
                    onPress={() => handleEdit(l.id)}
                    style={{
                      opacity: canEdit(l) ? 1 : 0.5,
                      paddingHorizontal: 12, paddingVertical: 10,
                      borderWidth: 1, borderColor: LINE, borderRadius: 10,
                      backgroundColor: "#f9fafb", minWidth: 90, alignItems: "center",
                    }}
                  >
                    {isLoadingThis ? <ActivityIndicator /> : <Text>Edit</Text>}
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modals */}
      <LocationFormModal
        visible={open === "create"}
        onClose={() => setOpen(null)}
        onSubmit={(payload) => createMut.mutate(payload)}
        isSaving={createMut.isPending}
      />
      <LocationFormModal
        visible={open === "edit"}
        onClose={() => { setOpen(null); setEditing(null); }}
        initial={editing}
        onSubmit={(payload) => updateMut.mutate(payload)}
        isSaving={updateMut.isPending}
        allowDelete={isAdmin && !!editing}
        onDelete={() => {
          Alert.alert("Delete", "Confirm delete this location?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
          ]);
        }}
      />
    </View>
  );
}
