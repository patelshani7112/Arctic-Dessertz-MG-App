// // apps/mobile/src/screens/Users.tsx
// import * as React from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   Modal,
//   Pressable,
//   ScrollView,
//   Text,
//   TextInput,
//   View,
// } from "react-native";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useActiveLocation } from "../lib/activeLocation";
// import {
//   Me,
//   UsersAPI,
//   RolesAPI,
//   Locations,
//   type RoleKey,
//   type ListUsersOptions,
//   type UserWithAssignments,
//   type EmploymentRecord,
// } from "../lib/api";

// /* ───────── constants ───────── */
// const LINE = "#e5e7eb";
// const BLUE = "#365cf5";
// const ALL = "__ALL__"; // admin sentinel (multi-select filter)

// /* ───────── Roles: fallback + hook ───────── */
// const ROLES_FALLBACK: RoleKey[] = [
//   "VIEW_ONLY",
//   "CASHIER",
//   "DISHWASHER",
//   "COOK",
//   "SERVER",
//   "MANAGER",
// ];

// function labelFromRole(r: RoleKey) {
//   return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
// }

// /** Returns role options with a robust fallback if API is empty/unavailable */
// function useRoleOptions() {
//   const q = useQuery({
//     queryKey: ["roles:options"],
//     queryFn: RolesAPI.options,
//     staleTime: 5 * 60 * 1000,
//   });
//   const roles = React.useMemo<RoleKey[]>(
//     () => (Array.isArray(q.data) && q.data.length ? (q.data as RoleKey[]) : ROLES_FALLBACK),
//     [q.data]
//   );
//   const options = React.useMemo(
//     () => roles.map((r) => ({ value: r, label: labelFromRole(r) })),
//     [roles]
//   );
//   return { options, roles, isLoading: q.isLoading };
// }

// /* ───────── small atoms ───────── */
// function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
//   return (
//     <View style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12, backgroundColor: "#fff" }}>
//       <View style={{ padding: 10, borderBottomWidth: 1, borderColor: LINE }}>
//         <Text style={{ fontWeight: "700" }}>{title}</Text>
//       </View>
//       <View style={{ padding: 12, gap: 10 }}>{children}</View>
//     </View>
//   );
// }
// function Input({
//   label, value, onChangeText, placeholder, keyboardType, secure,
// }:{
//   label?: string; value: string; onChangeText:(t:string)=>void; placeholder?: string;
//   keyboardType?: "default"|"numeric"|"email-address"|"phone-pad"; secure?: boolean;
// }) {
//   return (
//     <View style={{ gap: 6 }}>
//       {label ? <Text style={{ fontWeight: "600" }}>{label}</Text> : null}
//       <TextInput
//         value={value}
//         onChangeText={onChangeText}
//         placeholder={placeholder}
//         keyboardType={keyboardType}
//         secureTextEntry={secure}
//         autoCapitalize="none"
//         style={{
//           borderWidth: 1, borderColor: LINE, borderRadius: 12,
//           paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff",
//         }}
//       />
//     </View>
//   );
// }
// function Chip({ children }: React.PropsWithChildren) {
//   return (
//     <Text style={{
//       paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: LINE,
//       borderRadius: 999, backgroundColor: "#fff", fontSize: 12, marginRight: 6, marginBottom: 6,
//     }}>
//       {children}
//     </Text>
//   );
// }

// /* ───────── generic modals ───────── */
// function MultiSelectModal({
//   title, options, value, onChange, open, onClose, searchable = true,
// }:{
//   title: string;
//   options: { value: string; label: string }[];
//   value: string[];
//   onChange: (v: string[]) => void;
//   open: boolean;
//   onClose: () => void;
//   searchable?: boolean;
// }) {
//   const [q, setQ] = React.useState("");
//   React.useEffect(() => { if (open) setQ(""); }, [open]);
//   const filtered = React.useMemo(() => {
//     const s = q.trim().toLowerCase();
//     if (!s) return options;
//     return options.filter(o => o.label.toLowerCase().includes(s));
//   }, [q, options]);
//   const toggle = (v: string) => {
//     onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
//   };
//   return (
//     <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
//       <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
//       <View style={{ backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "70%" }}>
//         <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
//           <Text style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>{title}</Text>
//           <Pressable onPress={onClose} style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}>
//             <Text style={{ fontWeight: "700" }}>Close</Text>
//           </Pressable>
//         </View>
//         {searchable && (
//           <TextInput
//             placeholder="Search…"
//             value={q}
//             onChangeText={setQ}
//             style={{ borderWidth: 1, borderColor: LINE, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 }}
//           />
//         )}
//         <ScrollView>
//           {filtered.map(o => {
//             const on = value.includes(o.value);
//             return (
//               <Pressable
//                 key={o.value}
//                 onPress={() => toggle(o.value)}
//                 style={{
//                   paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8,
//                   backgroundColor: on ? "#eef2ff" : "transparent",
//                   flexDirection: "row", alignItems: "center",
//                 }}
//               >
//                 <View
//                   style={{
//                     width: 18, height: 18, borderRadius: 999, borderWidth: 2,
//                     borderColor: on ? BLUE : "#cbd5e1", marginRight: 10,
//                     backgroundColor: on ? BLUE : "transparent",
//                   }}
//                 />
//                 <Text style={{ flex: 1 }} numberOfLines={2}>{o.label}</Text>
//               </Pressable>
//             );
//           })}
//           {filtered.length === 0 && (
//             <View style={{ paddingVertical: 16 }}><Text style={{ color: "#6b7280" }}>No matches.</Text></View>
//           )}
//         </ScrollView>
//       </View>
//     </Modal>
//   );
// }

// function SingleSelectModal({
//   title, options, value, onChange, open, onClose,
// }:{
//   title: string;
//   options: { value: string; label: string }[];
//   value: string;
//   onChange: (v: string) => void;
//   open: boolean;
//   onClose: () => void;
// }) {
//   const [q, setQ] = React.useState("");
//   React.useEffect(()=>{ if (open) setQ(""); }, [open]);
//   const filtered = React.useMemo(()=>{
//     const s=q.trim().toLowerCase(); if(!s) return options;
//     return options.filter(o=>o.label.toLowerCase().includes(s));
//   }, [q, options]);

//   return (
//     <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
//       <Pressable onPress={onClose} style={{ flex:1, backgroundColor:"rgba(0,0,0,0.35)" }} />
//       <View style={{ backgroundColor:"#fff", padding:16, borderTopLeftRadius:16, borderTopRightRadius:16, maxHeight:"70%" }}>
//         <View style={{ flexDirection:"row", alignItems:"center", marginBottom:10 }}>
//           <Text style={{ fontSize:16, fontWeight:"800", flex:1 }}>{title}</Text>
//           <Pressable onPress={onClose} style={{ paddingHorizontal:10, paddingVertical:6, borderWidth:1, borderColor:LINE, borderRadius:10 }}>
//             <Text style={{ fontWeight:"700" }}>Close</Text>
//           </Pressable>
//         </View>
//         <TextInput
//           placeholder="Search…"
//           value={q}
//           onChangeText={setQ}
//           style={{ borderWidth:1, borderColor:LINE, borderRadius:10, paddingHorizontal:12, paddingVertical:10, marginBottom:10 }}
//         />
//         <ScrollView>
//           {filtered.map(o=>{
//             const on = value === o.value;
//             return (
//               <Pressable
//                 key={o.value}
//                 onPress={()=> onChange(o.value)}
//                 style={{
//                   paddingVertical:12, paddingHorizontal:8, borderRadius:8,
//                   backgroundColor: on ? "#eef2ff" : "transparent",
//                   flexDirection:"row", alignItems:"center",
//                 }}
//               >
//                 <View style={{
//                   width:18, height:18, borderRadius:999, borderWidth:2,
//                   borderColor: on ? BLUE : "#cbd5e1", marginRight:10, backgroundColor: on ? BLUE : "transparent",
//                 }}/>
//                 <Text style={{ flex:1 }} numberOfLines={2}>{o.label}</Text>
//               </Pressable>
//             );
//           })}
//           {filtered.length===0 && <View style={{ paddingVertical:16 }}><Text style={{ color:"#6b7280" }}>No matches.</Text></View>}
//         </ScrollView>
//       </View>
//     </Modal>
//   );
// }

// /* ───────── bundled picker line ───────── */
// function PickerLine({
//   label, value, onChange, options, disabled,
// }:{
//   label?: string;
//   value: string;
//   onChange: (v:string)=>void;
//   options: { value: string; label: string }[];
//   disabled?: boolean;
// }) {
//   const [open, setOpen] = React.useState(false);
//   const current = options.find(o => o.value === value)?.label || (options[0]?.label ?? "Select…");
//   return (
//     <View style={{ gap: 6 }}>
//       {label ? <Text style={{ fontWeight:"600" }}>{label}</Text> : null}
//       <Pressable
//         onPress={()=> setOpen(true)}
//         disabled={disabled}
//         style={{
//           borderWidth:1, borderColor: LINE, borderRadius:12, paddingHorizontal:12, paddingVertical:12,
//           backgroundColor: disabled ? "#f9fafb" : "#fff", opacity: disabled ? 0.6 : 1,
//         }}
//       >
//         <Text numberOfLines={1} style={{ fontWeight: "600" }}>{current}</Text>
//       </Pressable>
//       <SingleSelectModal
//         open={open}
//         onClose={()=>setOpen(false)}
//         title={label || "Select"}
//         options={options}
//         value={value}
//         onChange={(v)=>{ onChange(v); setOpen(false); }}
//       />
//     </View>
//   );
// }

// /* ───────── Create/Edit shared helpers ───────── */
// function parseMaybeJSON(s: string) {
//   try { return s.trim() ? JSON.parse(s) : undefined; } catch { return undefined; }
// }

// /* ───────── Main Users Screen ───────── */
// export default function UsersScreen() {
//   const qc = useQueryClient();
//   const { activeId, myLocations = [] } = useActiveLocation();

//   const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
//   const isAdmin = !!meQ.data?.is_global_admin;

//   const locsQ = useQuery({ queryKey: ["locations-all"], queryFn: Locations.list });
//   const { options: roleOptions, roles: rolesList, isLoading: rolesLoading } = useRoleOptions();

//   /* ── filters (multi-select, admin “All” sentinel) ── */
//   const [q, setQ] = React.useState("");
//   const [roleFilter, setRoleFilter] = React.useState<RoleKey[]>([]);
//   const [locFilter, setLocFilter]   = React.useState<string[]>([]);

//   // Non-admins default to active location when empty
//   React.useEffect(() => {
//     if (!isAdmin && activeId && locFilter.length === 0) setLocFilter([activeId]);
//   }, [isAdmin, activeId]);

//   const locationOptions = React.useMemo(
//     () => (locsQ.data || []).map((l: any) => ({ value: l.id, label: l.name })),
//     [locsQ.data]
//   );
//   const adminLocOptions = React.useMemo(
//     () => isAdmin ? [{ value: ALL, label: "All locations" }, ...locationOptions] : locationOptions,
//     [isAdmin, locationOptions]
//   );
//   const setLocFilterCanon = (vals: string[]) => {
//     if (isAdmin) setLocFilter(vals.includes(ALL) ? [ALL] : vals);
//     else setLocFilter(vals);
//   };

//   const listOpts = React.useMemo<ListUsersOptions>(() => {
//     let locIds: string[] | undefined;
//     if (isAdmin) {
//       if (locFilter.includes(ALL)) locIds = undefined;        // all
//       else if (locFilter.length)   locIds = locFilter;
//       else if (activeId)           locIds = [activeId];
//       else                         locIds = undefined;
//     } else {
//       locIds = locFilter.length ? locFilter : activeId ? [activeId] : undefined;
//     }
//     return {
//       q: q.trim() || undefined,
//       roles: roleFilter.length ? roleFilter : undefined,
//       location_ids: locIds,
//       sort_by: "created_at",
//       sort_dir: "desc",
//     };
//   }, [q, roleFilter, locFilter, isAdmin, activeId]);

//   const usersQ = useQuery({
//     queryKey: ["users", listOpts],
//     queryFn: () => UsersAPI.list(listOpts),
//     enabled: isAdmin || !!activeId,
//   });

//   /* ── create modal state ── */
//   type AssignRow = {
//     _id: string;
//     location_id: string;
//     role_key: RoleKey | "";
//     employment: {
//       position_title?: string;
//       employment_type?: string;
//       hire_date?: string;
//       termination_date?: string;
//       manager_user_id?: string;
//       pay_rate?: string;
//       pay_currency?: string;
//       scheduling_preferences?: string; // JSON text
//     };
//   };
//   const mkAssign = (): AssignRow => ({
//     _id: Math.random().toString(36).slice(2),
//     location_id: "",
//     role_key: "",
//     employment: {
//       position_title: "",
//       employment_type: "",
//       hire_date: "",
//       termination_date: "",
//       manager_user_id: "",
//       pay_rate: "",
//       pay_currency: "",
//       scheduling_preferences: "",
//     },
//   });

//   const [createOpen, setCreateOpen] = React.useState(false);
//   const [cForm, setCForm] = React.useState({
//     email: "",
//     password: "",
//     first_name: "",
//     last_name: "",
//     phone: "",
//     date_of_birth: "",
//     gender: "",
//     address: { street: "", city: "", state: "", postal_code: "", country: "" },
//     emergency: { name: "", relation: "", phone: "", notes: "" },
//     assignments: [mkAssign()] as AssignRow[],
//   });
//   const [cErrors, setCErrors] = React.useState<Record<string,string>>({});

//   const managedLocationIds = React.useMemo(
//     () => myLocations.filter(l => l.my_role === "MANAGER").map(l => l.id),
//     [myLocations]
//   );
//   const canEditRoleAt = (locId: string) => isAdmin || managedLocationIds.includes(locId);
//   const canRemoveAt   = (locId: string) => isAdmin || (!!activeId && activeId === locId);

//   function validateCreate() {
//     const e: Record<string,string> = {};
//     if (!cForm.email.trim()) e.email = "Email is required";
//     else if (!/^\S+@\S+\.\S+$/.test(cForm.email)) e.email = "Invalid email";
//     const filled = cForm.assignments.filter(a => a.location_id && a.role_key);
//     if (filled.length === 0) e.assignments = "Add at least one location + role";
//     cForm.assignments.forEach((a, idx) => {
//       const h = a.employment.hire_date || "";
//       const t = a.employment.termination_date || "";
//       if (h && t && new Date(t) < new Date(h)) e[`assign_${idx}_dates`] = "Termination cannot be before hire date";
//       const sp = a.employment.scheduling_preferences || "";
//       if (sp) { try { JSON.parse(sp); } catch { e[`assign_${idx}_json`] = "Scheduling preferences must be valid JSON"; } }
//     });
//     setCErrors(e);
//     return Object.keys(e).length === 0;
//   }

//   const invalidateUsers = async () => qc.invalidateQueries({ queryKey: ["users"] });

//   const createUser = useMutation({
//     mutationFn: async () => {
//       if (!validateCreate()) throw new Error("Please fix the form errors");

//       const rows = cForm.assignments.filter(a => a.location_id && a.role_key);
//       const assignments = rows.map(a => {
//         const emp: any = {};
//         if (a.employment.position_title) emp.position_title = a.employment.position_title;
//         if (a.employment.employment_type) emp.employment_type = a.employment.employment_type;
//         if (a.employment.hire_date) emp.hire_date = a.employment.hire_date;
//         if (a.employment.termination_date) emp.termination_date = a.employment.termination_date;
//         if (a.employment.manager_user_id) emp.manager_user_id = a.employment.manager_user_id;
//         if (a.employment.pay_currency) emp.pay_currency = a.employment.pay_currency;
//         if (a.employment.pay_rate) emp.pay_rate = a.employment.pay_rate;
//         if (a.employment.scheduling_preferences) {
//           const j = parseMaybeJSON(a.employment.scheduling_preferences || "");
//           if (j) emp.scheduling_preferences = j;
//         }
//         return { location_id: a.location_id, role_key: a.role_key as RoleKey, employment: Object.keys(emp).length ? emp : undefined };
//       });

//       // Create user
//       const res = await UsersAPI.create({
//         email: cForm.email.trim(),
//         password: cForm.password || undefined,
//         first_name: cForm.first_name || undefined,
//         last_name: cForm.last_name || undefined,
//         phone: cForm.phone || undefined,
//         assignments,
//       } as any);

//       // Optional profile patch (address, emergency, DoB, gender)
//       const addr = cForm.address;
//       const emg  = cForm.emergency;
//       const patch: any = {};
//       if (Object.values(addr).some(v => String(v).trim())) patch.address_json = addr;
//       if (Object.values(emg).some(v => String(v).trim())) patch.emergency_contact_json = emg;
//       if (cForm.date_of_birth) patch.date_of_birth = cForm.date_of_birth;
//       if (cForm.gender)       patch.gender       = cForm.gender;
//       if (Object.keys(patch).length) await UsersAPI.update((res as any).user_id, patch);

//       // Ensure pay_rate / extras per location via employment upsert
//       const withEmployment = rows.filter(r => r.employment && (
//         r.employment.position_title || r.employment.employment_type || r.employment.hire_date ||
//         r.employment.termination_date || r.employment.manager_user_id ||
//         r.employment.pay_currency || r.employment.pay_rate || r.employment.scheduling_preferences
//       ));
//       if (withEmployment.length) {
//         await Promise.all(withEmployment.map(r =>
//           UsersAPI.upsertEmployment((res as any).user_id, {
//             location_id: r.location_id,
//             position_title: r.employment?.position_title || undefined,
//             employment_type: r.employment?.employment_type || undefined,
//             hire_date: r.employment?.hire_date || undefined,
//             termination_date: r.employment?.termination_date || undefined,
//             manager_user_id: r.employment?.manager_user_id || undefined,
//             pay_currency: r.employment?.pay_currency || undefined,
//             pay_rate: r.employment?.pay_rate || undefined,
//             scheduling_preferences:
//               r.employment?.scheduling_preferences
//                 ? JSON.parse(r.employment.scheduling_preferences)
//                 : undefined,
//           } as EmploymentRecord)
//         ));
//       }

//       return res;
//     },
//     onSuccess: async () => {
//       setCreateOpen(false);
//       setCForm({
//         email: "", password: "", first_name: "", last_name: "", phone: "",
//         date_of_birth: "", gender: "",
//         address: { street:"", city:"", state:"", postal_code:"", country:"" },
//         emergency: { name:"", relation:"", phone:"", notes:"" },
//         assignments: [mkAssign()],
//       });
//       setCErrors({});
//       await invalidateUsers();
//       Alert.alert("Success", "User created");
//     },
//     onError: (e:any) => Alert.alert("Create failed", e?.message || "Please try again"),
//   });

//   /* ── edit modal state ── */
//   const [editOpen, setEditOpen] = React.useState(false);
//   const [editing, setEditing] = React.useState<UserWithAssignments | null>(null);
//   const [editProfile, setEditProfile] = React.useState({
//     first_name: "", last_name: "", phone: "", date_of_birth: "", gender: "",
//     address: { street:"", city:"", state:"", postal_code:"", country:"" },
//     emergency: { name:"", relation:"", phone:"", notes:"" },
//   });
//   const [editAssigns, setEditAssigns] = React.useState<{ location_id: string; role_key: RoleKey }[]>([]);
//   const [editEmployment, setEditEmployment] = React.useState<Record<string, {
//     position_title?: string; employment_type?: string; hire_date?: string; termination_date?: string;
//     manager_user_id?: string; pay_rate?: string; pay_currency?: string; scheduling_preferences?: string;
//   }>>({});
//   const [empErrors, setEmpErrors] = React.useState<Record<string,string>>({});

//   async function openEdit(userId: string) {
//     try {
//       const u = await UsersAPI.get(userId);
//       const addr = (u as any).address_json ?? {};
//       const emg  = (u as any).emergency_contact_json ?? {};
//       setEditing({
//         user_id: u.user_id,
//         full_name: u.full_name,
//         email: u.email,
//         phone: u.phone,
//         is_global_admin: u.is_global_admin,
//         assignments: u.assignments ?? [],
//       });
//       setEditProfile({
//         first_name: (u as any).first_name || "",
//         last_name:  (u as any).last_name  || "",
//         phone: u.phone || "",
//         date_of_birth: (u as any).date_of_birth || "",
//         gender: (u as any).gender || "",
//         address: {
//           street: addr.street || "", city: addr.city || "", state: addr.state || "",
//           postal_code: addr.postal_code || "", country: addr.country || "",
//         },
//         emergency: {
//           name: emg.name || "", relation: emg.relation || "",
//           phone: emg.phone || "", notes: emg.notes || "",
//         },
//       });
//       setEditAssigns((u.assignments || []).map((a:any) => ({
//         location_id: a.location_id, role_key: a.role_key as RoleKey,
//       })));
//       const rows = await UsersAPI.getEmployment(u.user_id);
//       const map: Record<string, any> = {};
//       (rows || []).forEach(r => {
//         map[r.location_id] = {
//           position_title: r.position_title || "",
//           employment_type: r.employment_type || "",
//           hire_date: r.hire_date || "",
//           termination_date: r.termination_date || "",
//           manager_user_id: r.manager_user_id || "",
//           pay_rate: r.pay_rate || "",
//           pay_currency: r.pay_currency || "",
//           scheduling_preferences: r.scheduling_preferences ? JSON.stringify(r.scheduling_preferences, null, 2) : "",
//         };
//       });
//       setEditEmployment(map);
//       setEmpErrors({});
//       setEditOpen(true);
//     } catch (e:any) {
//       Alert.alert("Load failed", e?.message || "Please try again");
//     }
//   }

//   const saveProfile = useMutation({
//     mutationFn: () => {
//       if (!editing) return Promise.resolve(null);
//       const patch: any = {
//         first_name: editProfile.first_name || undefined,
//         last_name:  editProfile.last_name  || undefined,
//         phone:      editProfile.phone      || undefined,
//         date_of_birth: editProfile.date_of_birth || undefined,
//         gender:        editProfile.gender        || undefined,
//       };
//       if (Object.values(editProfile.address).some(v => String(v).trim())) patch.address_json = editProfile.address;
//       if (Object.values(editProfile.emergency).some(v => String(v).trim())) patch.emergency_contact_json = editProfile.emergency;
//       return UsersAPI.update(editing.user_id, patch);
//     },
//     onSuccess: async () => { await invalidateUsers(); Alert.alert("Saved", "Profile updated"); },
//     onError: (e:any) => Alert.alert("Save failed", e?.message || "Please try again"),
//   });

//   const saveAssignments = useMutation({
//     mutationFn: async () => {
//       if (!editing) return;

//       // validate employment JSON/dates
//       const localErrors: Record<string,string> = {};
//       for (const [locId, e] of Object.entries(editEmployment)) {
//         if (e.hire_date && e.termination_date && new Date(e.termination_date) < new Date(e.hire_date)) {
//           localErrors[locId] = "Termination cannot be before hire date";
//         }
//         if (e.scheduling_preferences) {
//           try { JSON.parse(e.scheduling_preferences); } catch { localErrors[locId] = "Scheduling preferences must be valid JSON"; }
//         }
//       }
//       if (Object.keys(localErrors).length) { setEmpErrors(localErrors); throw new Error("Please fix employment errors"); }
//       setEmpErrors({});

//       // compute role assign/change/remove with permissions
//       const before = new Map(editing.assignments.map(a => [a.location_id, a.role_key as RoleKey]));
//       const after  = new Map(editAssigns.map(a => [a.location_id, a.role_key]));
//       const ops: Promise<any>[] = [];

//       // assign / change role (only where allowed)
//       after.forEach((role, locId) => {
//         if (!canEditRoleAt(locId)) return;
//         if (before.get(locId) !== role) ops.push(RolesAPI.assign(editing.user_id, locId, role));
//       });

//       // remove assignment (only if allowed)
//       before.forEach((_role, locId) => {
//         if (!after.has(locId) && canRemoveAt(locId)) {
//           ops.push(RolesAPI.remove(editing.user_id, locId)); // <-- sends DELETE with JSON body
//         }
//       });

//       // upsert employment (admin or manager of that location) — only for still-assigned locations
//       for (const [locId, form] of Object.entries(editEmployment)) {
//         if (!canEditRoleAt(locId) || !after.has(locId)) continue;
//         const payload: EmploymentRecord = {
//           location_id: locId,
//           position_title: form.position_title || undefined,
//           employment_type: form.employment_type || undefined,
//           hire_date: form.hire_date || undefined,
//           termination_date: form.termination_date || undefined,
//           manager_user_id: form.manager_user_id || undefined,
//           pay_currency: form.pay_currency || undefined,
//           pay_rate: form.pay_rate || undefined,
//           scheduling_preferences: form.scheduling_preferences ? JSON.parse(form.scheduling_preferences) : undefined,
//         };
//         ops.push(UsersAPI.upsertEmployment(editing.user_id, payload));
//       }

//       await Promise.all(ops);
//     },
//     onSuccess: async () => { await invalidateUsers(); Alert.alert("Saved", "Roles & employment saved"); },
//     onError: (e:any) => Alert.alert("Save failed", e?.message || "Please check your permissions and try again"),
//   });

//   /* ── UI ── */
//   const rows = usersQ.data || [];

//   return (
//     <View style={{ flex: 1, backgroundColor: "#fff" }}>
//       {/* Toolbar */}
//       <View style={{ padding: 12, gap: 10, borderBottomWidth: 1, borderColor: LINE, backgroundColor: "#fff" }}>
//         <Text style={{ fontSize: 18, fontWeight: "800" }}>Users</Text>

//         <TextInput
//           placeholder="Search name or email…"
//           value={q}
//           onChangeText={setQ}
//           style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" }}
//         />

//         <RoleAndLocationFilters
//           isAdmin={isAdmin}
//           roleOptions={roleOptions}
//           adminLocOptions={adminLocOptions}
//           roleValue={roleFilter}
//           locValue={
//             isAdmin ? (locFilter.length ? locFilter : activeId ? [activeId] : [ALL])
//                     : (locFilter.length ? locFilter : activeId ? [activeId] : [])
//           }
//           onRolesChange={setRoleFilter as any}
//           onLocsChange={setLocFilterCanon}
//         />

//         <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//           <Pressable
//             onPress={() => {
//               setQ("");
//               setRoleFilter([]);
//               setLocFilter(isAdmin ? [ALL] : activeId ? [activeId] : []);
//             }}
//             style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
//           >
//             <Text>Clear</Text>
//           </Pressable>

//           <Pressable
//             onPress={() => setCreateOpen(true)}
//             style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: BLUE }}
//           >
//             <Text style={{ color: "#fff", fontWeight: "700" }}>+ New User</Text>
//           </Pressable>
//         </View>
//       </View>

//       {/* List */}
//       {usersQ.isLoading ? (
//         <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//           <ActivityIndicator />
//         </View>
//       ) : rows.length === 0 ? (
//         <View style={{ padding: 20 }}><Text style={{ color: "#6b7280" }}>No users match your filters.</Text></View>
//       ) : (
//         <FlatList
//           data={rows}
//           keyExtractor={(u) => u.user_id}
//           contentContainerStyle={{ padding: 12, gap: 10 }}
//           renderItem={({ item: u }) => (
//             <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 12 }}>
//               <Text style={{ fontWeight: "700" }}>{u.full_name || "—"}</Text>
//               <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{u.email}</Text>

//               <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
//                 {u.assignments.length === 0 ? (
//                   <Text style={{ fontSize: 12, color: "#6b7280" }}>No locations</Text>
//                 ) : (
//                   u.assignments.map(a => (
//                     <View key={`${a.location_id}-${a.role_key}`} style={{ flexDirection: "row", alignItems: "center" }}>
//                       <Chip>{a.location_name}</Chip>
//                       <Chip>{labelFromRole(a.role_key as RoleKey)}</Chip>
//                     </View>
//                   ))
//                 )}
//               </View>

//               <View style={{ marginTop: 10, flexDirection: "row", justifyContent: "flex-end" }}>
//                 <Pressable
//                   onPress={() => openEdit(u.user_id)}
//                   style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
//                 >
//                   <Text>Edit</Text>
//                 </Pressable>
//               </View>
//             </View>
//           )}
//         />
//       )}

//       {/* Create Modal (full personal + assignments) */}
//       <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
//         <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
//           <Text style={{ fontSize: 18, fontWeight: "800" }}>Add user</Text>

//           {/* Personal */}
//           <Section title="Personal information">
//             <Input value={cForm.email} onChangeText={(v)=>setCForm({...cForm, email:v})} placeholder="Email *" keyboardType="email-address" />
//             {cErrors.email ? <Text style={{ color: "#b91c1c" }}>{cErrors.email}</Text> : null}
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.first_name} onChangeText={(v)=>setCForm({...cForm, first_name:v})} placeholder="First name" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.last_name}  onChangeText={(v)=>setCForm({...cForm, last_name:v})}  placeholder="Last name"  />
//               </View>
//             </View>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.phone} onChangeText={(v)=>setCForm({...cForm, phone:v})} placeholder="Phone" keyboardType="phone-pad" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.password} onChangeText={(v)=>setCForm({...cForm, password:v})} placeholder="Password (new only)" secure />
//               </View>
//             </View>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.date_of_birth} onChangeText={(v)=>setCForm({...cForm, date_of_birth:v})} placeholder="Date of birth (YYYY-MM-DD)" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.gender} onChangeText={(v)=>setCForm({...cForm, gender:v})} placeholder="Gender (optional)" />
//               </View>
//             </View>
//           </Section>

//           {/* Address */}
//           <Section title="Address (optional)">
//             <Input value={cForm.address.street} onChangeText={(v)=>setCForm({...cForm, address:{...cForm.address, street:v}})} placeholder="Street" />
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.address.city} onChangeText={(v)=>setCForm({...cForm, address:{...cForm.address, city:v}})} placeholder="City" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.address.state} onChangeText={(v)=>setCForm({...cForm, address:{...cForm.address, state:v}})} placeholder="State" />
//               </View>
//             </View>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.address.postal_code} onChangeText={(v)=>setCForm({...cForm, address:{...cForm.address, postal_code:v}})} placeholder="Postal code" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.address.country} onChangeText={(v)=>setCForm({...cForm, address:{...cForm.address, country:v}})} placeholder="Country" />
//               </View>
//             </View>
//           </Section>

//           {/* Emergency */}
//           <Section title="Emergency contact (optional)">
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.emergency.name} onChangeText={(v)=>setCForm({...cForm, emergency:{...cForm.emergency, name:v}})} placeholder="Name" />
//               </View>
//               <View style={{ flex: 1 }}>
//                 <Input value={cForm.emergency.relation} onChangeText={(v)=>setCForm({...cForm, emergency:{...cForm.emergency, relation:v}})} placeholder="Relationship" />
//               </View>
//             </View>
//             <Input value={cForm.emergency.phone} onChangeText={(v)=>setCForm({...cForm, emergency:{...cForm.emergency, phone:v}})} placeholder="Phone" />
//             <Input value={cForm.emergency.notes} onChangeText={(v)=>setCForm({...cForm, emergency:{...cForm.emergency, notes:v}})} placeholder="Notes" />
//           </Section>

//           {/* Assignments */}
//           <Section title="Location assignments">
//             {cErrors.assignments ? <Text style={{ color: "#b91c1c" }}>{cErrors.assignments}</Text> : null}
//             {cForm.assignments.map((row, idx) => {
//               const used = new Set(cForm.assignments.map(r => r.location_id).filter(Boolean));
//               const managerUsable = locationOptions.filter(o => myLocations.some(m => m.id === o.value && m.my_role === "MANAGER"));
//               const opts = (isAdmin ? locationOptions : managerUsable).filter(o => !used.has(o.value) || o.value === row.location_id);
//               const datesErr = cErrors[`assign_${idx}_dates`];
//               const jsonErr  = cErrors[`assign_${idx}_json`];

//               return (
//                 <View key={row._id} style={{ borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 10, gap: 8 }}>
//                   <PickerLine
//                     label={isAdmin ? "Location *" : "Managed location *"}
//                     value={row.location_id}
//                     onChange={(v)=> {
//                       const next = [...cForm.assignments]; next[idx] = { ...row, location_id: v }; setCForm({ ...cForm, assignments: next });
//                     }}
//                     options={[{ value:"", label: isAdmin ? "Select location *" : "Select managed location *" }, ...opts]}
//                     disabled={!isAdmin && opts.length===0}
//                   />
//                   <PickerLine
//                     label="Role *"
//                     value={row.role_key || ""}
//                     onChange={(v)=> {
//                       const next = [...cForm.assignments]; next[idx] = { ...row, role_key: v as RoleKey }; setCForm({ ...cForm, assignments: next });
//                     }}
//                     options={[{ value:"", label: rolesLoading ? "Loading roles…" : "Select role *" }, ...roleOptions]}
//                   />

//                   {/* Employment (optional full set) */}
//                   <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Professional (optional)</Text>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={row.employment.position_title || ""} onChangeText={(v)=> {
//                         const next=[...cForm.assignments]; next[idx].employment.position_title = v; setCForm({...cForm, assignments: next});
//                       }} placeholder="Position title" />
//                     </View>
//                     <View style={{ flex:1 }}>
//                       <Input value={row.employment.employment_type || ""} onChangeText={(v)=> {
//                         const next=[...cForm.assignments]; next[idx].employment.employment_type = v; setCForm({...cForm, assignments: next});
//                       }} placeholder="Employment type" />
//                     </View>
//                   </View>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={row.employment.hire_date || ""} onChangeText={(v)=> {
//                         const next=[...cForm.assignments]; next[idx].employment.hire_date = v; setCForm({...cForm, assignments: next});
//                       }} placeholder="Hire date (YYYY-MM-DD)" />
//                     </View>
//                     <View style={{ flex:1 }}>
//                       <Input value={row.employment.termination_date || ""} onChangeText={(v)=> {
//                         const next=[...cForm.assignments]; next[idx].employment.termination_date = v; setCForm({...cForm, assignments: next});
//                       }} placeholder="Termination date (YYYY-MM-DD)" />
//                     </View>
//                   </View>
//                   {datesErr ? <Text style={{ color:"#b91c1c" }}>{datesErr}</Text> : null}
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={row.employment.manager_user_id || ""} onChangeText={(v)=> {
//                         const next=[...cForm.assignments]; next[idx].employment.manager_user_id = v; setCForm({...cForm, assignments: next});
//                       }} placeholder="Manager user ID" />
//                     </View>
//                     <View style={{ flex:1, flexDirection:"row", gap: 10 }}>
//                       <View style={{ flex:1 }}>
//                         <Input value={row.employment.pay_rate || ""} onChangeText={(v)=> {
//                           const next=[...cForm.assignments]; next[idx].employment.pay_rate = v; setCForm({...cForm, assignments: next});
//                         }} placeholder="Pay rate" />
//                       </View>
//                       <View style={{ flex:1 }}>
//                         <Input value={row.employment.pay_currency || ""} onChangeText={(v)=> {
//                           const next=[...cForm.assignments]; next[idx].employment.pay_currency = v; setCForm({...cForm, assignments: next});
//                         }} placeholder="Currency" />
//                       </View>
//                     </View>
//                   </View>
//                   <Input value={row.employment.scheduling_preferences || ""} onChangeText={(v)=> {
//                     const next=[...cForm.assignments]; next[idx].employment.scheduling_preferences = v; setCForm({...cForm, assignments: next});
//                   }} placeholder='Scheduling preferences JSON (e.g. {"max_hours":30})' />
//                   {jsonErr ? <Text style={{ color:"#b91c1c" }}>{jsonErr}</Text> : null}

//                   <View style={{ flexDirection: "row", justifyContent:"flex-end" }}>
//                     <Pressable
//                       onPress={()=>{
//                         const next = cForm.assignments.filter(r => r._id !== row._id);
//                         setCForm({ ...cForm, assignments: next.length ? next : [mkAssign()] });
//                       }}
//                       style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth:1, borderColor:LINE, borderRadius:10 }}
//                     >
//                       <Text>Remove</Text>
//                     </Pressable>
//                   </View>
//                 </View>
//               );
//             })}

//             <Pressable
//               onPress={()=> setCForm({ ...cForm, assignments: [...cForm.assignments, mkAssign()] })}
//               style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: LINE, borderRadius: 10 }}
//             >
//               <Text>+ Add another location</Text>
//             </Pressable>
//           </Section>

//           {/* footer */}
//           <View style={{ flexDirection:"row", gap: 10, justifyContent:"flex-end" }}>
//             <Pressable onPress={()=> setCreateOpen(false)} style={{ paddingHorizontal: 14, paddingVertical: 10, borderWidth:1, borderColor:LINE, borderRadius:10 }}>
//               <Text>Cancel</Text>
//             </Pressable>
//             <Pressable
//               onPress={() => createUser.mutate()}
//               disabled={createUser.isPending}
//               style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: BLUE, opacity: createUser.isPending ? 0.7 : 1 }}
//             >
//               {createUser.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", fontWeight:"700" }}>Save</Text>}
//             </Pressable>
//           </View>
//         </ScrollView>
//       </Modal>

//       {/* Edit Modal (full personal + roles/employment with permissions) */}
//       <Modal visible={editOpen} animationType="slide" onRequestClose={()=> setEditOpen(false)}>
//         <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
//           <Text style={{ fontSize: 18, fontWeight: "800" }}>{editing ? `Edit ${editing.full_name}` : "Edit user"}</Text>

//           {/* Personal */}
//           <Section title="Personal information">
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex:1 }}><Input value={editProfile.first_name} onChangeText={(v)=>setEditProfile({...editProfile, first_name:v})} placeholder="First name" /></View>
//               <View style={{ flex:1 }}><Input value={editProfile.last_name}  onChangeText={(v)=>setEditProfile({...editProfile, last_name:v})}  placeholder="Last name"  /></View>
//             </View>
//             <Input value={editProfile.phone} onChangeText={(v)=>setEditProfile({...editProfile, phone:v})} placeholder="Phone" />
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex:1 }}><Input value={editProfile.date_of_birth} onChangeText={(v)=>setEditProfile({...editProfile, date_of_birth:v})} placeholder="Date of birth (YYYY-MM-DD)" /></View>
//               <View style={{ flex:1 }}><Input value={editProfile.gender} onChangeText={(v)=>setEditProfile({...editProfile, gender:v})} placeholder="Gender (optional)" /></View>
//             </View>
//           </Section>

//           {/* Address */}
//           <Section title="Address (optional)">
//             <Input value={editProfile.address.street} onChangeText={(v)=>setEditProfile({...editProfile, address:{...editProfile.address, street:v}})} placeholder="Street" />
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex:1 }}><Input value={editProfile.address.city} onChangeText={(v)=>setEditProfile({...editProfile, address:{...editProfile.address, city:v}})} placeholder="City" /></View>
//               <View style={{ flex:1 }}><Input value={editProfile.address.state} onChangeText={(v)=>setEditProfile({...editProfile, address:{...editProfile.address, state:v}})} placeholder="State" /></View>
//             </View>
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex:1 }}><Input value={editProfile.address.postal_code} onChangeText={(v)=>setEditProfile({...editProfile, address:{...editProfile.address, postal_code:v}})} placeholder="Postal code" /></View>
//               <View style={{ flex:1 }}><Input value={editProfile.address.country} onChangeText={(v)=>setEditProfile({...editProfile, address:{...editProfile.address, country:v}})} placeholder="Country" /></View>
//             </View>
//           </Section>

//           {/* Emergency */}
//           <Section title="Emergency contact (optional)">
//             <View style={{ flexDirection: "row", gap: 10 }}>
//               <View style={{ flex:1 }}><Input value={editProfile.emergency.name} onChangeText={(v)=>setEditProfile({...editProfile, emergency:{...editProfile.emergency, name:v}})} placeholder="Name" /></View>
//               <View style={{ flex:1 }}><Input value={editProfile.emergency.relation} onChangeText={(v)=>setEditProfile({...editProfile, emergency:{...editProfile.emergency, relation:v}})} placeholder="Relationship" /></View>
//             </View>
//             <Input value={editProfile.emergency.phone} onChangeText={(v)=>setEditProfile({...editProfile, emergency:{...editProfile.emergency, phone:v}})} placeholder="Phone" />
//             <Input value={editProfile.emergency.notes} onChangeText={(v)=>setEditProfile({...editProfile, emergency:{...editProfile.emergency, notes:v}})} placeholder="Notes" />
//           </Section>

//           {/* Roles & Employment */}
//           <Section title="Location roles & employment">
//             {(editAssigns || []).map((row, idx) => {
//               const locId = row.location_id;
//               const emp = editEmployment[locId] || {
//                 position_title:"", employment_type:"", hire_date:"", termination_date:"",
//                 manager_user_id:"", pay_rate:"", pay_currency:"", scheduling_preferences:"",
//               };
//               const err = empErrors[locId];
//               const roleDisabled = !canEditRoleAt(locId);

//               return (
//                 <View key={`${locId}-${idx}`} style={{ borderWidth: 1, borderColor: LINE, borderRadius: 10, padding: 10, gap: 8 }}>
//                   <PickerLine label="Location" value={locId} options={locationOptions} onChange={()=>{}} disabled />
//                   <PickerLine
//                     label={roleDisabled ? "Role (read-only here)" : "Role"}
//                     value={row.role_key}
//                     options={[...roleOptions]}
//                     onChange={(v)=> {
//                       if (roleDisabled) return;
//                       const next = [...editAssigns];
//                       next[idx] = { ...row, role_key: v as RoleKey };
//                       setEditAssigns(next);
//                     }}
//                     disabled={roleDisabled}
//                   />
//                   {!isAdmin && roleDisabled && (
//                     <Text style={{ color: "#6b7280", fontSize: 12 }}>
//                       You can only change roles at locations you manage.
//                     </Text>
//                   )}

//                   <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: "600" }}>Employment</Text>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={emp.position_title || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, position_title:v }}))} placeholder="Position title" />
//                     </View>
//                     <View style={{ flex:1 }}>
//                       <Input value={emp.employment_type || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, employment_type:v }}))} placeholder="Employment type" />
//                     </View>
//                   </View>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={emp.hire_date || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, hire_date:v }}))} placeholder="Hire date (YYYY-MM-DD)" />
//                     </View>
//                     <View style={{ flex:1 }}>
//                       <Input value={emp.termination_date || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, termination_date:v }}))} placeholder="Termination date (YYYY-MM-DD)" />
//                     </View>
//                   </View>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     <View style={{ flex:1 }}>
//                       <Input value={emp.manager_user_id || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, manager_user_id:v }}))} placeholder="Manager user ID" />
//                     </View>
//                     <View style={{ flex:1, flexDirection:"row", gap: 10 }}>
//                       <View style={{ flex:1 }}>
//                         <Input value={emp.pay_rate || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, pay_rate:v }}))} placeholder="Pay rate" />
//                       </View>
//                       <View style={{ flex:1 }}>
//                         <Input value={emp.pay_currency || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, pay_currency:v }}))} placeholder="Currency" />
//                       </View>
//                     </View>
//                   </View>
//                   <Input value={emp.scheduling_preferences || ""} onChangeText={(v)=> setEditEmployment(prev=>({ ...prev, [locId]:{ ...emp, scheduling_preferences:v }}))} placeholder='Scheduling preferences JSON' />

//                   {err ? <Text style={{ color:"#b91c1c" }}>{err}</Text> : null}

//                   <View style={{ flexDirection:"row", justifyContent:"flex-end" }}>
//                     <Pressable
//                       onPress={()=>{
//                         if (!canRemoveAt(locId)) {
//                           Alert.alert("Not allowed","You can only remove at your active location (or as admin).");
//                           return;
//                         }
//                         setEditAssigns(editAssigns.filter((_,i)=>i!==idx));
//                         setEditEmployment((prev:any) => {
//                           const next = { ...prev };
//                           delete next[locId];
//                           return next;
//                         });
//                       }}
//                       style={{ paddingHorizontal:12, paddingVertical:8, borderWidth:1, borderColor:LINE, borderRadius:10 }}
//                     >
//                       <Text>Remove</Text>
//                     </Pressable>
//                   </View>
//                 </View>
//               );
//             })}

//             <AddAssignmentRow
//               isAdmin={isAdmin}
//               locations={locationOptions}
//               roles={rolesList}
//               managedLocationIds={managedLocationIds}
//               onAdd={(locId, role)=> {
//                 if (editAssigns.find(a => a.location_id === locId)) return;
//                 setEditAssigns([...editAssigns, { location_id: locId, role_key: role }]);
//                 setEditEmployment(prev => ({
//                   ...prev, [locId]: {
//                     position_title:"", employment_type:"", hire_date:"", termination_date:"",
//                     manager_user_id:"", pay_rate:"", pay_currency:"", scheduling_preferences:"",
//                   },
//                 }));
//               }}
//             />
//           </Section>

//           {/* footer */}
//           <View style={{ flexDirection:"row", flexWrap:"wrap", gap: 10, justifyContent:"flex-end" }}>
//             <Pressable onPress={()=> { setEditOpen(false); setEditing(null); }} style={{ paddingHorizontal: 14, paddingVertical: 10, borderWidth:1, borderColor:LINE, borderRadius:10 }}>
//               <Text>Close</Text>
//             </Pressable>
//             <Pressable
//               onPress={()=> saveProfile.mutate()}
//               disabled={saveProfile.isPending}
//               style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth:1, borderColor:LINE }}
//             >
//               {saveProfile.isPending ? <ActivityIndicator /> : <Text style={{ fontWeight:"700" }}>Save profile</Text>}
//             </Pressable>
//             <Pressable
//               onPress={()=> saveAssignments.mutate()}
//               disabled={saveAssignments.isPending}
//               style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: BLUE, opacity: saveAssignments.isPending ? 0.7 : 1 }}
//             >
//               {saveAssignments.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color:"#fff", fontWeight:"700" }}>Save roles & employment</Text>}
//             </Pressable>
//           </View>
//         </ScrollView>
//       </Modal>
//     </View>
//   );
// }

// /* ───────── filters (roles + locations) ───────── */
// function RoleAndLocationFilters({
//   isAdmin,
//   roleOptions,
//   adminLocOptions,
//   roleValue,
//   locValue,
//   onRolesChange,
//   onLocsChange,
// }:{
//   isAdmin: boolean;
//   roleOptions: { value: string; label: string }[];
//   adminLocOptions: { value: string; label: string }[];
//   roleValue: string[];
//   locValue: string[];
//   onRolesChange: (v:string[]) => void;
//   onLocsChange: (v:string[]) => void;
// }) {
//   const [rolesOpen, setRolesOpen] = React.useState(false);
//   const [locsOpen,  setLocsOpen]  = React.useState(false);

//   const rolesText = roleValue.length ? `${roleValue.length} selected` : "All roles";
//   const locsText  = isAdmin
//     ? (locValue.includes(ALL) ? "All locations" : (locValue.length ? `${locValue.length} selected` : "All locations"))
//     : (locValue.length ? `${locValue.length} selected` : "Active location");

//   return (
//     <View style={{ flexDirection: "row", gap: 10 }}>
//       {/* Roles */}
//       <Pressable
//         onPress={()=> setRolesOpen(true)}
//         style={{ flex: 1, borderWidth:1, borderColor:LINE, borderRadius:12, paddingHorizontal:12, paddingVertical:12 }}
//       >
//         <Text style={{ fontSize: 12, color: "#6b7280" }}>Roles</Text>
//         <Text style={{ fontWeight: "700" }}>{rolesText}</Text>
//       </Pressable>
//       {/* Locations */}
//       <Pressable
//         onPress={()=> setLocsOpen(true)}
//         style={{ flex: 1, borderWidth:1, borderColor:LINE, borderRadius:12, paddingHorizontal:12, paddingVertical:12 }}
//       >
//         <Text style={{ fontSize: 12, color: "#6b7280" }}>Locations</Text>
//         <Text style={{ fontWeight: "700" }}>{locsText}</Text>
//       </Pressable>

//       {/* Modals */}
//       <MultiSelectModal
//         title="Select roles"
//         options={roleOptions}
//         value={roleValue}
//         onChange={onRolesChange}
//         open={rolesOpen}
//         onClose={()=> setRolesOpen(false)}
//       />
//       <MultiSelectModal
//         title="Select locations"
//         options={adminLocOptions}
//         value={locValue}
//         onChange={onLocsChange}
//         open={locsOpen}
//         onClose={()=> setLocsOpen(false)}
//       />
//     </View>
//   );
// }

// /* ───────── add-assignment row (edit modal) ───────── */
// function AddAssignmentRow({
//   isAdmin, locations, roles, managedLocationIds, onAdd,
// }:{
//   isAdmin: boolean;
//   locations: { value: string; label: string }[];
//   roles: RoleKey[];
//   managedLocationIds: string[];
//   onAdd: (location_id: string, role: RoleKey) => void;
// }) {
//   const managerLocs = React.useMemo(
//     () => locations.filter(l => managedLocationIds.includes(l.value)),
//     [locations, managedLocationIds]
//   );
//   const [loc, setLoc] = React.useState<string>(isAdmin ? "" : (managerLocs[0]?.value ?? ""));
//   const [role, setRole] = React.useState<RoleKey | "">("");

//   const allowed = isAdmin ? locations : managerLocs;

//   return (
//     <View style={{ gap: 8, borderWidth:1, borderColor:LINE, borderRadius:10, padding:10 }}>
//       <PickerLine
//         label="Location"
//         value={loc}
//         onChange={setLoc}
//         options={[{ value:"", label: isAdmin ? "Select location" : (allowed.length ? "Select location" : "No managed locations") }, ...allowed]}
//       />
//       <PickerLine
//         label="Role"
//         value={role || ""}
//         onChange={(v)=> setRole(v as RoleKey)}
//         options={[{ value:"", label:"Select role" }, ...roles.map(r=>({ value:r, label: labelFromRole(r) }))]}
//       />
//       <View style={{ flexDirection:"row", justifyContent:"flex-end" }}>
//         <Pressable
//           onPress={() => loc && role && onAdd(loc, role as RoleKey)}
//           disabled={!loc || !role}
//           style={{ paddingHorizontal: 12, paddingVertical: 8, borderWidth:1, borderColor:LINE, borderRadius:10, opacity: (!loc || !role) ? 0.6 : 1 }}
//         >
//           <Text>Add</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// }











// apps/mobile/src/screens/Users.tsx
import * as React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveLocation } from "../lib/activeLocation";
import {
  Me,
  UsersAPI,
  RolesAPI,
  Locations,
  type RoleKey,
  type ListUsersOptions,
  type UserWithAssignments,
  type EmploymentRecord,
} from "../lib/api";

/* ───────── theme ───────── */
const BG = "#f8fafc";
const LINE = "#e5e7eb";
const TEXT_MUTED = "#6b7280";
const BLUE = "#365cf5";
const BLUE_DARK = "#2d49c8";
const CARD_BG = "#ffffff";

/* ───────── helpers (ui) ───────── */
const shadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
};

function titleCase(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

function initialsFrom(name?: string, email?: string) {
  const n = (name || "").trim();
  if (n) {
    const parts = n.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }
  return (email?.[0] || "U").toUpperCase();
}
function colorFromString(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 90%)`; // soft pastel bg
}

/* ───────── Roles: fallback + hook ───────── */
const ROLES_FALLBACK: RoleKey[] = ["VIEW_ONLY", "CASHIER", "DISHWASHER", "COOK", "SERVER", "MANAGER"];

function useRoleOptions() {
  const q = useQuery({
    queryKey: ["roles:options"],
    queryFn: RolesAPI.options,
    staleTime: 5 * 60 * 1000,
  });
  const roles = React.useMemo<RoleKey[]>(
    () => (Array.isArray(q.data) && q.data.length ? (q.data as RoleKey[]) : ROLES_FALLBACK),
    [q.data]
  );
  const options = React.useMemo(
    () => roles.map((r) => ({ value: r, label: titleCase(r) })),
    [roles]
  );
  return { options, roles, isLoading: q.isLoading };
}

/* ───────── small atoms ───────── */
function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <View style={[{ borderWidth: 1, borderColor: LINE, borderRadius: 14, backgroundColor: CARD_BG }, shadow]}>
      <View style={{ padding: 12, borderBottomWidth: 1, borderColor: LINE }}>
        <Text style={{ fontWeight: "700" }}>{title}</Text>
      </View>
      <View style={{ padding: 12, gap: 10 as any }}>{children}</View>
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  secure?: boolean;
}) {
  return (
    <View style={{ gap: 6 as any }}>
      {label ? <Text style={{ fontWeight: "600" }}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: LINE,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}

function Chip({ children, tone = "neutral" as "neutral" | "blue" | "soft" }) {
  const map = {
    neutral: { bg: "#fff", br: LINE, color: "#111827" },
    blue: { bg: "#eef2ff", br: "#c7d2fe", color: BLUE },
    soft: { bg: "#f1f5f9", br: "#e2e8f0", color: "#0f172a" },
  };
  const t = map[tone];
  return (
    <Text
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: t.br,
        color: t.color,
        borderRadius: 999,
        backgroundColor: t.bg,
        fontSize: 12,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function GhostButton({
  onPress,
  children,
  danger,
}: React.PropsWithChildren<{ onPress: () => void; danger?: boolean }>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: danger ? "#fecaca" : LINE,
        borderRadius: 10,
        backgroundColor: pressed ? "#f8fafc" : "#fff",
      })}
    >
      <Text style={{ color: danger ? "#b91c1c" : "#111827" }}>{children}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  onPress,
  children,
  disabled,
  small,
}: React.PropsWithChildren<{ onPress: () => void; disabled?: boolean; small?: boolean }>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        paddingHorizontal: small ? 12 : 14,
        paddingVertical: small ? 8 : 10,
        borderRadius: 10,
        backgroundColor: disabled ? "#94a3b8" : pressed ? BLUE_DARK : BLUE,
      })}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{children}</Text>
    </Pressable>
  );
}

/* ───────── generic modals ───────── */
function MultiSelectModal({
  title,
  options,
  value,
  onChange,
  open,
  onClose,
  searchable = true,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  open: boolean;
  onClose: () => void;
  searchable?: boolean;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.label.toLowerCase().includes(s));
  }, [q, options]);
  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
      <View
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70%",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>{title}</Text>
          <GhostButton onPress={onClose}>Close</GhostButton>
        </View>
        {searchable && (
          <TextInput
            placeholder="Search…"
            value={q}
            onChangeText={setQ}
            style={{
              borderWidth: 1,
              borderColor: LINE,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              marginBottom: 10,
              backgroundColor: "#fff",
            }}
          />
        )}
        <ScrollView>
          {filtered.map((o) => {
            const on = value.includes(o.value);
            return (
              <Pressable
                key={o.value}
                onPress={() => toggle(o.value)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: on ? "#eef2ff" : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: on ? BLUE : "#cbd5e1",
                    marginRight: 10,
                    backgroundColor: on ? BLUE : "transparent",
                  }}
                />
                <Text style={{ flex: 1 }} numberOfLines={2}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: TEXT_MUTED }}>No matches.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function SingleSelectModal({
  title,
  options,
  value,
  onChange,
  open,
  onClose,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    if (open) setQ("");
  }, [open]);
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((o) => o.label.toLowerCase().includes(s));
  }, [q, options]);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
      <View
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "70%",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", flex: 1 }}>{title}</Text>
          <GhostButton onPress={onClose}>Close</GhostButton>
        </View>
        <TextInput
          placeholder="Search…"
          value={q}
          onChangeText={setQ}
          style={{
            borderWidth: 1,
            borderColor: LINE,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            backgroundColor: "#fff",
          }}
        />
        <ScrollView>
          {filtered.map((o) => {
            const on = value === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => onChange(o.value)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: on ? "#eef2ff" : "transparent",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: on ? BLUE : "#cbd5e1",
                    marginRight: 10,
                    backgroundColor: on ? BLUE : "transparent",
                  }}
                />
                <Text style={{ flex: 1 }} numberOfLines={2}>
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ color: TEXT_MUTED }}>No matches.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

/* ───────── picker line ───────── */
function PickerLine({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const current = options.find((o) => o.value === value)?.label || options[0]?.label || "Select…";
  return (
    <View style={{ gap: 6 as any, flex: 1 }}>
      {label ? <Text style={{ fontWeight: "600" }}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        style={{
          borderWidth: 1,
          borderColor: LINE,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: disabled ? "#f3f4f6" : "#fff",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <Text numberOfLines={1} style={{ fontWeight: "600" }}>
          {current}
        </Text>
      </Pressable>
      <SingleSelectModal
        open={open}
        onClose={() => setOpen(false)}
        title={label || "Select"}
        options={options}
        value={value}
        onChange={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </View>
  );
}

/* ───────── shared helpers ───────── */
function parseMaybeJSON(s: string) {
  try {
    return s.trim() ? JSON.parse(s) : undefined;
  } catch {
    return undefined;
  }
}

/* ───────── Main Users Screen ───────── */
const ALL = "__ALL__";

export default function UsersScreen() {
  const qc = useQueryClient();
  const { activeId, myLocations = [] } = useActiveLocation();

  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const isAdmin = !!meQ.data?.is_global_admin;

  const locsQ = useQuery({ queryKey: ["locations-all"], queryFn: Locations.list });
  const { options: roleOptions, roles: rolesList, isLoading: rolesLoading } = useRoleOptions();

  /* filters */
  const [q, setQ] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<RoleKey[]>([]);
  const [locFilter, setLocFilter] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!isAdmin && activeId && locFilter.length === 0) setLocFilter([activeId]);
  }, [isAdmin, activeId]);

  const locationOptions = React.useMemo(
    () => (locsQ.data || []).map((l: any) => ({ value: l.id, label: l.name })),
    [locsQ.data]
  );
  const adminLocOptions = React.useMemo(
    () => (isAdmin ? [{ value: ALL, label: "All locations" }, ...locationOptions] : locationOptions),
    [isAdmin, locationOptions]
  );
  const setLocFilterCanon = (vals: string[]) => {
    if (isAdmin) setLocFilter(vals.includes(ALL) ? [ALL] : vals);
    else setLocFilter(vals);
  };

  const listOpts = React.useMemo<ListUsersOptions>(() => {
    let locIds: string[] | undefined;
    if (isAdmin) {
      if (locFilter.includes(ALL)) locIds = undefined;
      else if (locFilter.length) locIds = locFilter;
      else if (activeId) locIds = [activeId];
      else locIds = undefined;
    } else {
      locIds = locFilter.length ? locFilter : activeId ? [activeId] : undefined;
    }
    return {
      q: q.trim() || undefined,
      roles: roleFilter.length ? roleFilter : undefined,
      location_ids: locIds,
      sort_by: "created_at",
      sort_dir: "desc",
    };
  }, [q, roleFilter, locFilter, isAdmin, activeId]);

  const usersQ = useQuery({
    queryKey: ["users", listOpts],
    queryFn: () => UsersAPI.list(listOpts),
    enabled: isAdmin || !!activeId,
  });

  /* create modal state */
  type AssignRow = {
    _id: string;
    location_id: string;
    role_key: RoleKey | "";
    employment: {
      position_title?: string;
      employment_type?: string;
      hire_date?: string;
      termination_date?: string;
      manager_user_id?: string;
      pay_rate?: string;
      pay_currency?: string;
      scheduling_preferences?: string; // JSON text
    };
  };
  const mkAssign = (): AssignRow => ({
    _id: Math.random().toString(36).slice(2),
    location_id: "",
    role_key: "",
    employment: {
      position_title: "",
      employment_type: "",
      hire_date: "",
      termination_date: "",
      manager_user_id: "",
      pay_rate: "",
      pay_currency: "",
      scheduling_preferences: "",
    },
  });

  const [createOpen, setCreateOpen] = React.useState(false);
  const [cForm, setCForm] = React.useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: { street: "", city: "", state: "", postal_code: "", country: "" },
    emergency: { name: "", relation: "", phone: "", notes: "" },
    assignments: [mkAssign()] as AssignRow[],
  });
  const [cErrors, setCErrors] = React.useState<Record<string, string>>({});

  const managedLocationIds = React.useMemo(
    () => myLocations.filter((l) => l.my_role === "MANAGER").map((l) => l.id),
    [myLocations]
  );
  const canEditRoleAt = (locId: string) => isAdmin || managedLocationIds.includes(locId);
  const canRemoveAt = (locId: string) => isAdmin || (!!activeId && activeId === locId);

  function validateCreate() {
    const e: Record<string, string> = {};
    if (!cForm.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(cForm.email)) e.email = "Invalid email";
    const filled = cForm.assignments.filter((a) => a.location_id && a.role_key);
    if (filled.length === 0) e.assignments = "Add at least one location + role";
    cForm.assignments.forEach((a, idx) => {
      const h = a.employment.hire_date || "";
      const t = a.employment.termination_date || "";
      if (h && t && new Date(t) < new Date(h)) e[`assign_${idx}_dates`] = "Termination cannot be before hire date";
      const sp = a.employment.scheduling_preferences || "";
      try {
        if (sp) JSON.parse(sp);
      } catch {
        e[`assign_${idx}_json`] = "Scheduling preferences must be valid JSON";
      }
    });
    setCErrors(e);
    return Object.keys(e).length === 0;
  }

  const invalidateUsers = async () => qc.invalidateQueries({ queryKey: ["users"] });

  const createUser = useMutation({
    mutationFn: async () => {
      if (!validateCreate()) throw new Error("Please fix the form errors");

      const rows = cForm.assignments.filter((a) => a.location_id && a.role_key);
      const assignments = rows.map((a) => {
        const emp: any = {};
        if (a.employment.position_title) emp.position_title = a.employment.position_title;
        if (a.employment.employment_type) emp.employment_type = a.employment.employment_type;
        if (a.employment.hire_date) emp.hire_date = a.employment.hire_date;
        if (a.employment.termination_date) emp.termination_date = a.employment.termination_date;
        if (a.employment.manager_user_id) emp.manager_user_id = a.employment.manager_user_id;
        if (a.employment.pay_currency) emp.pay_currency = a.employment.pay_currency;
        if (a.employment.pay_rate) emp.pay_rate = a.employment.pay_rate;
        if (a.employment.scheduling_preferences) {
          const j = parseMaybeJSON(a.employment.scheduling_preferences || "");
          if (j) emp.scheduling_preferences = j;
        }
        return {
          location_id: a.location_id,
          role_key: a.role_key as RoleKey,
          employment: Object.keys(emp).length ? emp : undefined,
        };
      });

      const res = await UsersAPI.create({
        email: cForm.email.trim(),
        password: cForm.password || undefined,
        first_name: cForm.first_name || undefined,
        last_name: cForm.last_name || undefined,
        phone: cForm.phone || undefined,
        assignments,
      } as any);

      const addr = cForm.address;
      const emg = cForm.emergency;
      const patch: any = {};
      if (Object.values(addr).some((v) => String(v).trim())) patch.address_json = addr;
      if (Object.values(emg).some((v) => String(v).trim())) patch.emergency_contact_json = emg;
      if (cForm.date_of_birth) patch.date_of_birth = cForm.date_of_birth;
      if (cForm.gender) patch.gender = cForm.gender;
      if (Object.keys(patch).length) await UsersAPI.update((res as any).user_id, patch);

      const withEmployment = rows.filter(
        (r) =>
          r.employment &&
          (r.employment.position_title ||
            r.employment.employment_type ||
            r.employment.hire_date ||
            r.employment.termination_date ||
            r.employment.manager_user_id ||
            r.employment.pay_currency ||
            r.employment.pay_rate ||
            r.employment.scheduling_preferences)
      );
      if (withEmployment.length) {
        await Promise.all(
          withEmployment.map((r) =>
            UsersAPI.upsertEmployment((res as any).user_id, {
              location_id: r.location_id,
              position_title: r.employment?.position_title || undefined,
              employment_type: r.employment?.employment_type || undefined,
              hire_date: r.employment?.hire_date || undefined,
              termination_date: r.employment?.termination_date || undefined,
              manager_user_id: r.employment?.manager_user_id || undefined,
              pay_currency: r.employment?.pay_currency || undefined,
              pay_rate: r.employment?.pay_rate || undefined,
              scheduling_preferences: r.employment?.scheduling_preferences
                ? JSON.parse(r.employment.scheduling_preferences)
                : undefined,
            } as EmploymentRecord)
          )
        );
      }

      return res;
    },
    onSuccess: async () => {
      setCreateOpen(false);
      setCForm({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone: "",
        date_of_birth: "",
        gender: "",
        address: { street: "", city: "", state: "", postal_code: "", country: "" },
        emergency: { name: "", relation: "", phone: "", notes: "" },
        assignments: [mkAssign()],
      });
      setCErrors({});
      await invalidateUsers();
      Alert.alert("Success", "User created");
    },
    onError: (e: any) => Alert.alert("Create failed", e?.message || "Please try again"),
  });

  /* edit modal state */
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserWithAssignments | null>(null);
  const [editProfile, setEditProfile] = React.useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: { street: "", city: "", state: "", postal_code: "", country: "" },
    emergency: { name: "", relation: "", phone: "", notes: "" },
  });
  const [editAssigns, setEditAssigns] = React.useState<{ location_id: string; role_key: RoleKey }[]>([]);
  const [editEmployment, setEditEmployment] = React.useState<
    Record<
      string,
      {
        position_title?: string;
        employment_type?: string;
        hire_date?: string;
        termination_date?: string;
        manager_user_id?: string;
        pay_rate?: string;
        pay_currency?: string;
        scheduling_preferences?: string;
      }
    >
  >({});
  const [empErrors, setEmpErrors] = React.useState<Record<string, string>>({});

  async function openEdit(userId: string) {
    try {
      const u = await UsersAPI.get(userId);
      const addr = (u as any).address_json ?? {};
      const emg = (u as any).emergency_contact_json ?? {};
      setEditing({
        user_id: u.user_id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        is_global_admin: u.is_global_admin,
        assignments: u.assignments ?? [],
      });
      setEditProfile({
        first_name: (u as any).first_name || "",
        last_name: (u as any).last_name || "",
        phone: u.phone || "",
        date_of_birth: (u as any).date_of_birth || "",
        gender: (u as any).gender || "",
        address: {
          street: addr.street || "",
          city: addr.city || "",
          state: addr.state || "",
          postal_code: addr.postal_code || "",
          country: addr.country || "",
        },
        emergency: {
          name: emg.name || "",
          relation: emg.relation || "",
          phone: emg.phone || "",
          notes: emg.notes || "",
        },
      });
      setEditAssigns(
        (u.assignments || []).map((a: any) => ({
          location_id: a.location_id,
          role_key: a.role_key as RoleKey,
        }))
      );
      const rows = await UsersAPI.getEmployment(u.user_id);
      const map: Record<string, any> = {};
      (rows || []).forEach((r) => {
        map[r.location_id] = {
          position_title: r.position_title || "",
          employment_type: r.employment_type || "",
          hire_date: r.hire_date || "",
          termination_date: r.termination_date || "",
          manager_user_id: r.manager_user_id || "",
          pay_rate: r.pay_rate || "",
          pay_currency: r.pay_currency || "",
          scheduling_preferences: r.scheduling_preferences ? JSON.stringify(r.scheduling_preferences, null, 2) : "",
        };
      });
      setEditEmployment(map);
      setEmpErrors({});
      setEditOpen(true);
    } catch (e: any) {
      Alert.alert("Load failed", e?.message || "Please try again");
    }
  }

  const saveProfile = useMutation({
    mutationFn: () => {
      if (!editing) return Promise.resolve(null);
      const patch: any = {
        first_name: editProfile.first_name || undefined,
        last_name: editProfile.last_name || undefined,
        phone: editProfile.phone || undefined,
        date_of_birth: editProfile.date_of_birth || undefined,
        gender: editProfile.gender || undefined,
      };
      if (Object.values(editProfile.address).some((v) => String(v).trim())) patch.address_json = editProfile.address;
      if (Object.values(editProfile.emergency).some((v) => String(v).trim()))
        patch.emergency_contact_json = editProfile.emergency;
      return UsersAPI.update(editing.user_id, patch);
    },
    onSuccess: async () => {
      await invalidateUsers();
      Alert.alert("Saved", "Profile updated");
    },
    onError: (e: any) => Alert.alert("Save failed", e?.message || "Please try again"),
  });

  const saveAssignments = useMutation({
    mutationFn: async () => {
      if (!editing) return;

      // validate employment JSON/dates
      const localErrors: Record<string, string> = {};
      for (const [locId, e] of Object.entries(editEmployment)) {
        if (e.hire_date && e.termination_date && new Date(e.termination_date) < new Date(e.hire_date)) {
          localErrors[locId] = "Termination cannot be before hire date";
        }
        if (e.scheduling_preferences) {
          try {
            JSON.parse(e.scheduling_preferences);
          } catch {
            localErrors[locId] = "Scheduling preferences must be valid JSON";
          }
        }
      }
      if (Object.keys(localErrors).length) {
        setEmpErrors(localErrors);
        throw new Error("Please fix employment errors");
      }
      setEmpErrors({});

      const before = new Map(editing.assignments.map((a) => [a.location_id, a.role_key as RoleKey]));
      const after = new Map(editAssigns.map((a) => [a.location_id, a.role_key]));
      const ops: Promise<any>[] = [];

      after.forEach((role, locId) => {
        if (!canEditRoleAt(locId)) return;
        if (before.get(locId) !== role) ops.push(RolesAPI.assign(editing.user_id, locId, role));
      });

      // remove assignment (only if allowed)
      before.forEach((_role, locId) => {
        if (!after.has(locId) && canRemoveAt(locId)) {
          ops.push(RolesAPI.remove(editing.user_id, locId)); // DELETE with JSON body (fixed in api.ts)
        }
      });

      // upsert employment (only for still-assigned)
      for (const [locId, form] of Object.entries(editEmployment)) {
        if (!canEditRoleAt(locId) || !after.has(locId)) continue;
        const payload: EmploymentRecord = {
          location_id: locId,
          position_title: form.position_title || undefined,
          employment_type: form.employment_type || undefined,
          hire_date: form.hire_date || undefined,
          termination_date: form.termination_date || undefined,
          manager_user_id: form.manager_user_id || undefined,
          pay_currency: form.pay_currency || undefined,
          pay_rate: form.pay_rate || undefined,
          scheduling_preferences: form.scheduling_preferences ? JSON.parse(form.scheduling_preferences) : undefined,
        };
        ops.push(UsersAPI.upsertEmployment(editing.user_id, payload));
      }

      await Promise.all(ops);
    },
    onSuccess: async () => {
      await invalidateUsers();
      Alert.alert("Saved", "Roles & employment saved");
    },
    onError: (e: any) => Alert.alert("Save failed", e?.message || "Please check your permissions and try again"),
  });

  /* UI */
  const rows = usersQ.data || [];
  const refreshing = usersQ.isRefetching;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: LINE,
          backgroundColor: "#fff",
          gap: 10 as any,
        }}
      >
        {/* Row 1: Title + New User */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", flex: 1 }}>Users</Text>
          <PrimaryButton onPress={() => setCreateOpen(true)} small>
            + New User
          </PrimaryButton>
        </View>

        {/* Row 2: Search */}
        <View style={[{ position: "relative" }]}>
          <TextInput
            placeholder="🔍  Search name or email…"
            value={q}
            onChangeText={setQ}
            style={{
              borderWidth: 1,
              borderColor: LINE,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#fff",
            }}
          />
        </View>

        {/* Row 3: Filters line (Roles • Locations • Clear) */}
        <FiltersRow
          isAdmin={isAdmin}
          roleOptions={roleOptions}
          adminLocOptions={adminLocOptions}
          roleValue={roleFilter}
          locValue={
            isAdmin ? (locFilter.length ? locFilter : activeId ? [activeId] : [ALL]) : locFilter.length ? locFilter : activeId ? [activeId] : []
          }
          onRolesChange={setRoleFilter as any}
          onLocsChange={setLocFilterCanon}
          onClear={() => {
            setQ("");
            setRoleFilter([]);
            setLocFilter(isAdmin ? [ALL] : activeId ? [activeId] : []);
          }}
        />
      </View>

      {/* List */}
      {usersQ.isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator />
        </View>
      ) : rows.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🗂️</Text>
          <Text style={{ color: TEXT_MUTED, textAlign: "center" }}>
            No users match your filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(u) => u.user_id}
          contentContainerStyle={{ padding: 14, gap: 10 as any }}
          refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={() => usersQ.refetch()} />}
          renderItem={({ item: u }) => {
            const ini = initialsFrom(u.full_name, u.email);
            const pastel = colorFromString(u.email || u.full_name || u.user_id);
            const maxShow = 2;
            const extra = Math.max(0, u.assignments.length - maxShow);
            return (
              <View style={[{ backgroundColor: CARD_BG, borderWidth: 1, borderColor: LINE, borderRadius: 14, padding: 12 }, shadow]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 999,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: pastel,
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                    }}
                  >
                    <Text style={{ fontWeight: "800" }}>{ini}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700" }}>{u.full_name || "—"}</Text>
                    <Text style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>{u.email}</Text>
                  </View>
                  <GhostButton onPress={() => openEdit(u.user_id)}>Edit</GhostButton>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                  {u.assignments.length === 0 ? (
                    <Text style={{ fontSize: 12, color: TEXT_MUTED }}>No locations</Text>
                  ) : (
                    <>
                      {u.assignments.slice(0, maxShow).map((a) => (
                        <View key={`${a.location_id}-${a.role_key}`} style={{ flexDirection: "row", alignItems: "center" }}>
                          <Chip tone="soft">{a.location_name}</Chip>
                          <Chip tone="blue">{titleCase(a.role_key as RoleKey)}</Chip>
                        </View>
                      ))}
                      {extra > 0 && <Chip tone="neutral">+ {extra} more</Chip>}
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Create Modal */}
      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 as any, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: "800" }}>Add user</Text>

          {/* Personal */}
          <Section title="Personal information">
            <Input
              value={cForm.email}
              onChangeText={(v) => setCForm({ ...cForm, email: v })}
              placeholder="Email *"
              keyboardType="email-address"
            />
            {cErrors.email ? <Text style={{ color: "#b91c1c" }}>{cErrors.email}</Text> : null}
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input value={cForm.first_name} onChangeText={(v) => setCForm({ ...cForm, first_name: v })} placeholder="First name" />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={cForm.last_name} onChangeText={(v) => setCForm({ ...cForm, last_name: v })} placeholder="Last name" />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input value={cForm.phone} onChangeText={(v) => setCForm({ ...cForm, phone: v })} placeholder="Phone" keyboardType="phone-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={cForm.password} onChangeText={(v) => setCForm({ ...cForm, password: v })} placeholder="Password (new only)" secure />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.date_of_birth}
                  onChangeText={(v) => setCForm({ ...cForm, date_of_birth: v })}
                  placeholder="Date of birth (YYYY-MM-DD)"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={cForm.gender} onChangeText={(v) => setCForm({ ...cForm, gender: v })} placeholder="Gender (optional)" />
              </View>
            </View>
          </Section>

          {/* Address */}
          <Section title="Address (optional)">
            <Input
              value={cForm.address.street}
              onChangeText={(v) => setCForm({ ...cForm, address: { ...cForm.address, street: v } })}
              placeholder="Street"
            />
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.address.city}
                  onChangeText={(v) => setCForm({ ...cForm, address: { ...cForm.address, city: v } })}
                  placeholder="City"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.address.state}
                  onChangeText={(v) => setCForm({ ...cForm, address: { ...cForm.address, state: v } })}
                  placeholder="State"
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.address.postal_code}
                  onChangeText={(v) => setCForm({ ...cForm, address: { ...cForm.address, postal_code: v } })}
                  placeholder="Postal code"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.address.country}
                  onChangeText={(v) => setCForm({ ...cForm, address: { ...cForm.address, country: v } })}
                  placeholder="Country"
                />
              </View>
            </View>
          </Section>

          {/* Emergency */}
          <Section title="Emergency contact (optional)">
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.emergency.name}
                  onChangeText={(v) => setCForm({ ...cForm, emergency: { ...cForm.emergency, name: v } })}
                  placeholder="Name"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={cForm.emergency.relation}
                  onChangeText={(v) => setCForm({ ...cForm, emergency: { ...cForm.emergency, relation: v } })}
                  placeholder="Relationship"
                />
              </View>
            </View>
            <Input
              value={cForm.emergency.phone}
              onChangeText={(v) => setCForm({ ...cForm, emergency: { ...cForm.emergency, phone: v } })}
              placeholder="Phone"
            />
            <Input
              value={cForm.emergency.notes}
              onChangeText={(v) => setCForm({ ...cForm, emergency: { ...cForm.emergency, notes: v } })}
              placeholder="Notes"
            />
          </Section>

          {/* Assignments */}
          <Section title="Location assignments">
            {cErrors.assignments ? <Text style={{ color: "#b91c1c" }}>{cErrors.assignments}</Text> : null}
            {cForm.assignments.map((row, idx) => {
              const used = new Set(cForm.assignments.map((r) => r.location_id).filter(Boolean));
              const managerUsable = locationOptions.filter((o) => myLocations.some((m) => m.id === o.value && m.my_role === "MANAGER"));
              const opts = (isAdmin ? locationOptions : managerUsable).filter((o) => !used.has(o.value) || o.value === row.location_id);
              const datesErr = cErrors[`assign_${idx}_dates`];
              const jsonErr = cErrors[`assign_${idx}_json`];

              return (
                <View key={row._id} style={[{ borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 10, gap: 8 as any }, shadow]}>
                  <PickerLine
                    label={isAdmin ? "Location *" : "Managed location *"}
                    value={row.location_id}
                    onChange={(v) => {
                      const next = [...cForm.assignments];
                      next[idx] = { ...row, location_id: v };
                      setCForm({ ...cForm, assignments: next });
                    }}
                    options={[{ value: "", label: isAdmin ? "Select location *" : "Select managed location *" }, ...opts]}
                    disabled={!isAdmin && opts.length === 0}
                  />
                  <PickerLine
                    label="Role *"
                    value={row.role_key || ""}
                    onChange={(v) => {
                      const next = [...cForm.assignments];
                      next[idx] = { ...row, role_key: v as RoleKey };
                      setCForm({ ...cForm, assignments: next });
                    }}
                    options={[{ value: "", label: rolesLoading ? "Loading roles…" : "Select role *" }, ...roleOptions]}
                  />

                  <Text style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: "600" }}>Professional (optional)</Text>
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={row.employment.position_title || ""}
                        onChangeText={(v) => {
                          const next = [...cForm.assignments];
                          next[idx].employment.position_title = v;
                          setCForm({ ...cForm, assignments: next });
                        }}
                        placeholder="Position title"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={row.employment.employment_type || ""}
                        onChangeText={(v) => {
                          const next = [...cForm.assignments];
                          next[idx].employment.employment_type = v;
                          setCForm({ ...cForm, assignments: next });
                        }}
                        placeholder="Employment type"
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={row.employment.hire_date || ""}
                        onChangeText={(v) => {
                          const next = [...cForm.assignments];
                          next[idx].employment.hire_date = v;
                          setCForm({ ...cForm, assignments: next });
                        }}
                        placeholder="Hire date (YYYY-MM-DD)"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={row.employment.termination_date || ""}
                        onChangeText={(v) => {
                          const next = [...cForm.assignments];
                          next[idx].employment.termination_date = v;
                          setCForm({ ...cForm, assignments: next });
                        }}
                        placeholder="Termination date (YYYY-MM-DD)"
                      />
                    </View>
                  </View>
                  {datesErr ? <Text style={{ color: "#b91c1c" }}>{datesErr}</Text> : null}
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={row.employment.manager_user_id || ""}
                        onChangeText={(v) => {
                          const next = [...cForm.assignments];
                          next[idx].employment.manager_user_id = v;
                          setCForm({ ...cForm, assignments: next });
                        }}
                        placeholder="Manager user ID"
                      />
                    </View>
                    <View style={{ flex: 1, flexDirection: "row", gap: 10 as any }}>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={row.employment.pay_rate || ""}
                          onChangeText={(v) => {
                            const next = [...cForm.assignments];
                            next[idx].employment.pay_rate = v;
                            setCForm({ ...cForm, assignments: next });
                          }}
                          placeholder="Pay rate"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={row.employment.pay_currency || ""}
                          onChangeText={(v) => {
                            const next = [...cForm.assignments];
                            next[idx].employment.pay_currency = v;
                            setCForm({ ...cForm, assignments: next });
                          }}
                          placeholder="Currency"
                        />
                      </View>
                    </View>
                  </View>
                  <Input
                    value={row.employment.scheduling_preferences || ""}
                    onChangeText={(v) => {
                      const next = [...cForm.assignments];
                      next[idx].employment.scheduling_preferences = v;
                      setCForm({ ...cForm, assignments: next });
                    }}
                    placeholder='Scheduling preferences JSON (e.g. {"max_hours":30})'
                  />
                  {jsonErr ? <Text style={{ color: "#b91c1c" }}>{jsonErr}</Text> : null}

                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <GhostButton
                      onPress={() => {
                        const next = cForm.assignments.filter((r) => r._id !== row._id);
                        setCForm({ ...cForm, assignments: next.length ? next : [mkAssign()] });
                      }}
                    >
                      Remove
                    </GhostButton>
                  </View>
                </View>
              );
            })}

            <GhostButton onPress={() => setCForm({ ...cForm, assignments: [...cForm.assignments, mkAssign()] })}>
              + Add another location
            </GhostButton>
          </Section>

          {/* footer */}
          <View style={{ flexDirection: "row", gap: 10 as any, justifyContent: "flex-end" }}>
            <GhostButton onPress={() => setCreateOpen(false)}>Cancel</GhostButton>
            <PrimaryButton onPress={() => createUser.mutate()} disabled={createUser.isPending}>
              {createUser.isPending ? "Saving…" : "Save"}
            </PrimaryButton>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 as any, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: "800" }}>{editing ? `Edit ${editing.full_name}` : "Edit user"}</Text>

          {/* Personal */}
          <Section title="Personal information">
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.first_name}
                  onChangeText={(v) => setEditProfile({ ...editProfile, first_name: v })}
                  placeholder="First name"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={editProfile.last_name} onChangeText={(v) => setEditProfile({ ...editProfile, last_name: v })} placeholder="Last name" />
              </View>
            </View>
            <Input value={editProfile.phone} onChangeText={(v) => setEditProfile({ ...editProfile, phone: v })} placeholder="Phone" />
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.date_of_birth}
                  onChangeText={(v) => setEditProfile({ ...editProfile, date_of_birth: v })}
                  placeholder="Date of birth (YYYY-MM-DD)"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input value={editProfile.gender} onChangeText={(v) => setEditProfile({ ...editProfile, gender: v })} placeholder="Gender (optional)" />
              </View>
            </View>
          </Section>

          {/* Address */}
          <Section title="Address (optional)">
            <Input
              value={editProfile.address.street}
              onChangeText={(v) => setEditProfile({ ...editProfile, address: { ...editProfile.address, street: v } })}
              placeholder="Street"
            />
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.address.city}
                  onChangeText={(v) => setEditProfile({ ...editProfile, address: { ...editProfile.address, city: v } })}
                  placeholder="City"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.address.state}
                  onChangeText={(v) => setEditProfile({ ...editProfile, address: { ...editProfile.address, state: v } })}
                  placeholder="State"
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.address.postal_code}
                  onChangeText={(v) => setEditProfile({ ...editProfile, address: { ...editProfile.address, postal_code: v } })}
                  placeholder="Postal code"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.address.country}
                  onChangeText={(v) => setEditProfile({ ...editProfile, address: { ...editProfile.address, country: v } })}
                  placeholder="Country"
                />
              </View>
            </View>
          </Section>

          {/* Emergency */}
          <Section title="Emergency contact (optional)">
            <View style={{ flexDirection: "row", gap: 10 as any }}>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.emergency.name}
                  onChangeText={(v) => setEditProfile({ ...editProfile, emergency: { ...editProfile.emergency, name: v } })}
                  placeholder="Name"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={editProfile.emergency.relation}
                  onChangeText={(v) => setEditProfile({ ...editProfile, emergency: { ...editProfile.emergency, relation: v } })}
                  placeholder="Relationship"
                />
              </View>
            </View>
            <Input
              value={editProfile.emergency.phone}
              onChangeText={(v) => setEditProfile({ ...editProfile, emergency: { ...editProfile.emergency, phone: v } })}
              placeholder="Phone"
            />
            <Input
              value={editProfile.emergency.notes}
              onChangeText={(v) => setEditProfile({ ...editProfile, emergency: { ...editProfile.emergency, notes: v } })}
              placeholder="Notes"
            />
          </Section>

          {/* Roles & Employment */}
          <Section title="Location roles & employment">
            {(editAssigns || []).map((row, idx) => {
              const locId = row.location_id;
              const emp =
                editEmployment[locId] || {
                  position_title: "",
                  employment_type: "",
                  hire_date: "",
                  termination_date: "",
                  manager_user_id: "",
                  pay_rate: "",
                  pay_currency: "",
                  scheduling_preferences: "",
                };
              const err = empErrors[locId];
              const roleDisabled = !canEditRoleAt(locId);

              return (
                <View key={`${locId}-${idx}`} style={{ borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 10, gap: 8 as any }}>
                  <PickerLine label="Location" value={locId} options={locationOptions} onChange={() => {}} disabled />
                  <PickerLine
                    label={roleDisabled ? "Role (read-only here)" : "Role"}
                    value={row.role_key}
                    options={[...roleOptions]}
                    onChange={(v) => {
                      if (roleDisabled) return;
                      const next = [...editAssigns];
                      next[idx] = { ...row, role_key: v as RoleKey };
                      setEditAssigns(next);
                    }}
                    disabled={roleDisabled}
                  />
                  {!isAdmin && roleDisabled && (
                    <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>You can only change roles at locations you manage.</Text>
                  )}

                  <Text style={{ fontSize: 12, color: TEXT_MUTED, fontWeight: "600" }}>Employment</Text>
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={emp.position_title || ""}
                        onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, position_title: v } }))}
                        placeholder="Position title"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={emp.employment_type || ""}
                        onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, employment_type: v } }))}
                        placeholder="Employment type"
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={emp.hire_date || ""}
                        onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, hire_date: v } }))}
                        placeholder="Hire date (YYYY-MM-DD)"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={emp.termination_date || ""}
                        onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, termination_date: v } }))}
                        placeholder="Termination date (YYYY-MM-DD)"
                      />
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 as any }}>
                    <View style={{ flex: 1 }}>
                      <Input
                        value={emp.manager_user_id || ""}
                        onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, manager_user_id: v } }))}
                        placeholder="Manager user ID"
                      />
                    </View>
                    <View style={{ flex: 1, flexDirection: "row", gap: 10 as any }}>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={emp.pay_rate || ""}
                          onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, pay_rate: v } }))}
                          placeholder="Pay rate"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Input
                          value={emp.pay_currency || ""}
                          onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, pay_currency: v } }))}
                          placeholder="Currency"
                        />
                      </View>
                    </View>
                  </View>
                  <Input
                    value={emp.scheduling_preferences || ""}
                    onChangeText={(v) => setEditEmployment((prev) => ({ ...prev, [locId]: { ...emp, scheduling_preferences: v } }))}
                    placeholder="Scheduling preferences JSON"
                  />

                  {err ? <Text style={{ color: "#b91c1c" }}>{err}</Text> : null}

                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <GhostButton
                      onPress={() => {
                        if (!canRemoveAt(locId)) {
                          Alert.alert("Not allowed", "You can only remove at your active location (or as admin).");
                          return;
                        }
                        setEditAssigns(editAssigns.filter((_, i) => i !== idx));
                        setEditEmployment((prev: any) => {
                          const next = { ...prev };
                          delete next[locId];
                          return next;
                        });
                      }}
                    >
                      Remove
                    </GhostButton>
                  </View>
                </View>
              );
            })}

            <AddAssignmentRow
              isAdmin={isAdmin}
              locations={locationOptions}
              roles={rolesList}
              managedLocationIds={managedLocationIds}
              onAdd={(locId, role) => {
                if (editAssigns.find((a) => a.location_id === locId)) return;
                setEditAssigns([...editAssigns, { location_id: locId, role_key: role }]);
                setEditEmployment((prev) => ({
                  ...prev,
                  [locId]: {
                    position_title: "",
                    employment_type: "",
                    hire_date: "",
                    termination_date: "",
                    manager_user_id: "",
                    pay_rate: "",
                    pay_currency: "",
                    scheduling_preferences: "",
                  },
                }));
              }}
            />
          </Section>

          {/* footer */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 as any, justifyContent: "flex-end" }}>
            <GhostButton
              onPress={() => {
                setEditOpen(false);
                setEditing(null);
              }}
            >
              Close
            </GhostButton>
            <GhostButton onPress={() => saveProfile.mutate()}>{saveProfile.isPending ? "Saving…" : "Save profile"}</GhostButton>
            <PrimaryButton onPress={() => saveAssignments.mutate()} disabled={saveAssignments.isPending}>
              {saveAssignments.isPending ? "Saving…" : "Save roles & employment"}
            </PrimaryButton>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

/* ───────── filters row (roles + locations + clear) ───────── */
function FiltersRow({
  isAdmin,
  roleOptions,
  adminLocOptions,
  roleValue,
  locValue,
  onRolesChange,
  onLocsChange,
  onClear,
}: {
  isAdmin: boolean;
  roleOptions: { value: string; label: string }[];
  adminLocOptions: { value: string; label: string }[];
  roleValue: string[];
  locValue: string[];
  onRolesChange: (v: string[]) => void;
  onLocsChange: (v: string[]) => void;
  onClear: () => void;
}) {
  const [rolesOpen, setRolesOpen] = React.useState(false);
  const [locsOpen, setLocsOpen] = React.useState(false);

  const rolesText = roleValue.length ? `${roleValue.length} selected` : "All roles";
  const locsText = isAdmin
    ? locValue.includes(ALL)
      ? "All locations"
      : locValue.length
      ? `${locValue.length} selected`
      : "All locations"
    : locValue.length
    ? `${locValue.length} selected`
    : "Active location";

  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 as any }}>
        <Pressable
          onPress={() => setRolesOpen(true)}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: LINE,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 12, color: TEXT_MUTED }}>Roles</Text>
          <Text style={{ fontWeight: "700" }}>{rolesText}</Text>
        </Pressable>

        <Pressable
          onPress={() => setLocsOpen(true)}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: LINE,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 12,
            backgroundColor: "#fff",
          }}
        >
          <Text style={{ fontSize: 12, color: TEXT_MUTED }}>Locations</Text>
          <Text style={{ fontWeight: "700" }}>{locsText}</Text>
        </Pressable>

        <GhostButton onPress={onClear}>Clear</GhostButton>
      </View>

      {/* Modals */}
      <MultiSelectModal
        title="Select roles"
        options={roleOptions}
        value={roleValue}
        onChange={onRolesChange}
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
      />
      <MultiSelectModal
        title="Select locations"
        options={adminLocOptions}
        value={locValue}
        onChange={onLocsChange}
        open={locsOpen}
        onClose={() => setLocsOpen(false)}
      />
    </>
  );
}

/* ───────── add-assignment row (edit modal) ───────── */
function AddAssignmentRow({
  isAdmin,
  locations,
  roles,
  managedLocationIds,
  onAdd,
}: {
  isAdmin: boolean;
  locations: { value: string; label: string }[];
  roles: RoleKey[];
  managedLocationIds: string[];
  onAdd: (location_id: string, role: RoleKey) => void;
}) {
  const managerLocs = React.useMemo(
    () => locations.filter((l) => managedLocationIds.includes(l.value)),
    [locations, managedLocationIds]
  );
  const [loc, setLoc] = React.useState<string>(isAdmin ? "" : managerLocs[0]?.value ?? "");
  const [role, setRole] = React.useState<RoleKey | "">("");

  const allowed = isAdmin ? locations : managerLocs;

  return (
    <View style={{ gap: 8 as any, borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 10 }}>
      <PickerLine
        label="Location"
        value={loc}
        onChange={setLoc}
        options={[{ value: "", label: isAdmin ? "Select location" : allowed.length ? "Select location" : "No managed locations" }, ...allowed]}
      />
      <PickerLine
        label="Role"
        value={role || ""}
        onChange={(v) => setRole(v as RoleKey)}
        options={[{ value: "", label: "Select role" }, ...roles.map((r) => ({ value: r, label: titleCase(r) }))]}
      />
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <GhostButton onPress={() => loc && role && onAdd(loc, role as RoleKey)}>{!loc || !role ? "Select to add" : "Add"}</GhostButton>
      </View>
    </View>
  );
}
