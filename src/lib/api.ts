
// import { supabase } from "./supabase";

// /* ───────────────────────────── env / base URL ───────────────────────────── */

// const RAW_API = process.env.EXPO_PUBLIC_API_BASE ?? "";
// export const API_BASE = RAW_API.replace(/\/+$/, ""); // strip trailing slash
// if (!API_BASE) throw new Error("EXPO_PUBLIC_API_BASE is not set");

// /** Join base + path safely; allow absolute URLs too */
// export function toUrl(path: string) {
//   if (/^https?:\/\//i.test(path)) return path;
//   const p = path.startsWith("/") ? path : `/${path}`;
//   return `${API_BASE}${p}`;
// }

// /* ───────────────────────────── types ───────────────────────────── */

// export type ProfileMe = {
//   user_id: string;
//   full_name: string;
//   email: string;
//   is_global_admin: boolean;
// };

// export type RoleKey =
//   | "VIEW_ONLY"
//   | "CASHIER"
//   | "DISHWASHER"
//   | "COOK"
//   | "SERVER"
//   | "MANAGER";

// /** Hours / schedule */
// export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
// export type Interval = { open: string; close: string };
// export type DayHours = { closed?: boolean; intervals: Interval[] };
// export type HoursJson = Record<DayKey, DayHours>;

// /** Location (expanded for management UI parity) */
// export type Location = {
//   id: string;
//   name: string;
//   tz: string;

//   // presentation / filters
//   brand_name?: string | null;
//   is_active?: boolean | null;

//   // contact + address
//   contact_phone?: string | null;
//   contact_email?: string | null;
//   address_json?: {
//     street?: string;
//     city?: string;
//     state?: string;
//     postal_code?: string;
//     country?: string;
//   } | null;

//   // geo / ops
//   latitude?: number | null;
//   longitude?: number | null;
//   geofence_meters?: number | null;

//   // integrations
//   pos_external_id?: string | null;
//   printer_config_json?: any | null;

//   // schedule
//   open_hours_json?: HoursJson | null;

//   // my relationship
//   my_role?: RoleKey | null;

//   // misc
//   created_at?: string | null;
// };

// /** Users list options */
// export type ListUsersOptions = {
//   q?: string;
//   roles?: RoleKey[];
//   location_ids?: string[];
//   category?: "admins" | "managers" | "staff";
//   sort_by?: "name" | "email" | "created_at";
//   sort_dir?: "asc" | "desc";
// };

// /** Detail shape for Profile screens (mirrors web) */
// export type UserDetail = {
//   first_name?: string | null;
//   last_name?: string | null;
//   full_name?: string | null;
//   phone?: string | null;
//   date_of_birth?: string | null;
//   gender?: string | null;
//   address_json?: {
//     street?: string;
//     city?: string;
//     state?: string;
//     postal_code?: string;
//     country?: string;
//   } | null;
//   emergency_contact_json?: {
//     name?: string;
//     relation?: string;
//     phone?: string;
//     notes?: string;
//   } | null;
//   assignments?: Array<{
//     location_id: string;
//     location_name: string;
//     role_key: RoleKey;
//   }>;
// };

// export type EmploymentRecord = {
//   location_id: string;
//   employment_type?: string | null;
//   position_title?: string | null;
// };

// /* ───────────────────────────── utils ───────────────────────────── */

// export class ApiError extends Error {
//   readonly status: number;
//   readonly url: string;
//   readonly body?: string;
//   constructor(message: string, opts: { status: number; url: string; body?: string }) {
//     super(message);
//     this.name = "ApiError";
//     this.status = opts.status;
//     this.url = opts.url;
//     this.body = opts.body;
//   }
// }

// function looksLikeJson(headers: Headers): boolean {
//   const ct = headers.get("content-type") || "";
//   return /application\/([a-z.+-]*\+)?json/i.test(ct);
// }

// /** Build a query string from an object (joins arrays with commas) */
// function qs(params?: Record<string, unknown>): string {
//   if (!params) return "";
//   const flat: Record<string, string> = {};
//   for (const [k, v] of Object.entries(params)) {
//     if (v == null) continue;
//     flat[k] = Array.isArray(v) ? v.join(",") : String(v);
//   }
//   const s = new URLSearchParams(flat).toString();
//   return s ? `?${s}` : "";
// }

// /* ───────────────────────────── core fetcher ───────────────────────────── */

// type RequestOpts = RequestInit & { timeoutMs?: number };

// async function request<T>(path: string, init: RequestOpts = {}): Promise<T> {
//   const { timeoutMs = 10_000, ...reqInit } = init;
//   const url = toUrl(path);

//   const { data } = await supabase.auth.getSession();
//   const token = data.session?.access_token;

//   const hasBody = typeof reqInit.body !== "undefined";
//   const isFormData =
//     typeof FormData !== "undefined" && reqInit.body instanceof FormData;

//   const headers: Record<string, string> = {
//     Accept: "application/json",
//     ...(reqInit.headers as Record<string, string>),
//     ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };

//   const ctrl = new AbortController();
//   const timer = setTimeout(() => ctrl.abort(), timeoutMs);

//   try {
//     const res = await fetch(url, {
//       cache: "no-store",
//       ...reqInit,
//       headers,
//       signal: ctrl.signal,
//     });

//     if (!res.ok) {
//       let bodyText = "";
//       try {
//         bodyText = await res.text();
//       } catch {}
//       const msg = bodyText || res.statusText || `HTTP ${res.status}`;
//       throw new ApiError(msg, { status: res.status, url, body: bodyText });
//     }

//     if (res.status === 204) return undefined as unknown as T;

//     if (looksLikeJson(res.headers)) {
//       return (await res.json()) as T;
//     }

//     const text = await res.text();
//     try {
//       return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
//     } catch {
//       // @ts-expect-error allow text for diagnostics in dev
//       return text;
//     }
//   } catch (err: any) {
//     if (err?.name === "AbortError") {
//       throw new Error(`Request timed out after ${timeoutMs}ms — ${url}`);
//     }
//     if (err instanceof ApiError) throw err;
//     throw new Error(`Network error: ${err?.message || String(err)} — ${url}`);
//   } finally {
//     clearTimeout(timer);
//   }
// }

// /* ───────────────────────────── helpers ───────────────────────────── */

// export const apiGet = <T>(p: string, opts?: { timeoutMs?: number }) =>
//   request<T>(p, { method: "GET", ...(opts || {}) });

// export const apiPost = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
//   request<T>(p, { method: "POST", body: body == null ? undefined : JSON.stringify(body), ...(opts || {}) });

// export const apiPut = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
//   request<T>(p, { method: "PUT", body: body == null ? undefined : JSON.stringify(body), ...(opts || {}) });

// export const apiPatch = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
//   request<T>(p, { method: "PATCH", body: body == null ? undefined : JSON.stringify(body), ...(opts || {}) });

// export const apiDelete = <T>(p: string, opts?: { timeoutMs?: number }) =>
//   request<T>(p, { method: "DELETE", ...(opts || {}) });

// /* ───────────────────────────── API surface ───────────────────────────── */

// export const Me = {
//   get: () => apiGet<ProfileMe>("/v1/me"),
// };

// export const My = {
//   locations: () => apiGet<Location[]>("/v1/my/locations"),
// };

// export const Users = {
//   list: (opts?: ListUsersOptions) => apiGet<any>(`/v1/users${qs(opts)}`),
//   get: (id: string) => apiGet<UserDetail>(`/v1/users/${id}`),
//   // optional helper if your API exposes it:
//   getEmployment: (id: string) => apiGet<EmploymentRecord[]>(`/v1/users/${id}/employment`),
// };

// /** Locations CRUD for management UI */
// export const Locations = {
//   list: () => apiGet<Location[]>("/v1/locations"),
//   create: (body: Partial<Location> & { name: string; tz: string }) =>
//     apiPost<Location>("/v1/locations", body),
//   update: (id: string, body: Partial<Location>) =>
//     apiPatch<Location>(`/v1/locations/${id}`, body),
//   delete: (id: string) => apiDelete<void>(`/v1/locations/${id}`),
// };

// /* ───────────────────────────── debug helpers ───────────────────────────── */

// export async function pingApiHealth() {
//   try {
//     const res = await fetch(toUrl("/health"));
//     const txt = await res.text();
//     console.log("API /health ->", res.status, txt);
//   } catch (e) {
//     console.log("API /health failed ->", e);
//   }
// }


// apps/mobile/src/lib/api.ts
import { supabase } from "./supabase";

/* ───────────────────────────── env / base URL ───────────────────────────── */

const RAW_API = process.env.EXPO_PUBLIC_API_BASE ?? "";
export const API_BASE = RAW_API.replace(/\/+$/, ""); // strip trailing slash
if (!API_BASE) throw new Error("EXPO_PUBLIC_API_BASE is not set");

/** Join base + path safely; allow absolute URLs too */
export function toUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

/* ───────────────────────────── types ───────────────────────────── */

export type ProfileMe = {
  user_id: string;
  full_name: string;
  email: string;
  is_global_admin: boolean;
};

export type RoleKey =
  | "VIEW_ONLY"
  | "CASHIER"
  | "DISHWASHER"
  | "COOK"
  | "SERVER"
  | "MANAGER";

/** Hours / schedule */
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type Interval = { open: string; close: string };
export type DayHours = { closed?: boolean; intervals: Interval[] };
export type HoursJson = Record<DayKey, DayHours>;

/** Location (expanded for management UI parity) */
export type Location = {
  id: string;
  name: string;
  tz: string;

  // presentation / filters
  brand_name?: string | null;
  is_active?: boolean | null;

  // contact + address
  contact_phone?: string | null;
  contact_email?: string | null;
  address_json?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;

  // geo / ops
  latitude?: number | null;
  longitude?: number | null;
  geofence_meters?: number | null;

  // integrations
  pos_external_id?: string | null;
  printer_config_json?: any | null;

  // schedule
  open_hours_json?: HoursJson | null;

  // my relationship (from /v1/my/locations etc.)
  my_role?: RoleKey | null;

  // misc
  created_at?: string | null;
};

/** Users list options (kept 'category' for backwards compatibility) */
export type ListUsersOptions = {
  q?: string;
  roles?: RoleKey[];
  location_ids?: string[];
  sort_by?: "name" | "email" | "created_at";
  sort_dir?: "asc" | "desc";
  category?: "admins" | "managers" | "staff";
};

/** Detail shape for Profile screens (mirrors web) */
export type UserDetail = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address_json?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  } | null;
  emergency_contact_json?: {
    name?: string;
    relation?: string;
    phone?: string;
    notes?: string;
  } | null;
  assignments?: Array<{
    location_id: string;
    location_name: string;
    role_key: RoleKey;
  }>;
};

export type EmploymentRecord = {
  location_id: string;
  position_title?: string | null;
  employment_type?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  manager_user_id?: string | null;
  pay_rate?: string | null;
  pay_currency?: string | null;
  scheduling_preferences?: any | null;
};

export type UserAssignment = {
  location_id: string;
  location_name: string;
  role_key: RoleKey;
};

export type UserWithAssignments = {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_global_admin?: boolean;
  assignments: UserAssignment[];
};

/* ───────────────────────────── utils ───────────────────────────── */

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly body?: string;
  constructor(message: string, opts: { status: number; url: string; body?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.url = opts.url;
    this.body = opts.body;
  }
}

function looksLikeJson(headers: Headers): boolean {
  const ct = headers.get("content-type") || "";
  return /application\/([a-z.+-]*\+)?json/i.test(ct);
}

/** Build a query string from an object (joins arrays with commas) */
export function qs(params?: Record<string, unknown>): string {
  if (!params) return "";
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    flat[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  const s = new URLSearchParams(flat).toString();
  return s ? `?${s}` : "";
}

/* ───────────────────────────── core fetcher ───────────────────────────── */

type RequestOpts = RequestInit & { timeoutMs?: number };

async function request<T>(path: string, init: RequestOpts = {}): Promise<T> {
  const { timeoutMs = 10_000, ...reqInit } = init;
  const url = toUrl(path);

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const hasBody = typeof reqInit.body !== "undefined";
  const isFormData =
    typeof FormData !== "undefined" && reqInit.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(reqInit.headers as Record<string, string>),
    ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: "no-store",
      ...reqInit,
      headers,
      signal: ctrl.signal,
    });

    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch {
        // ignore
      }
      const msg = bodyText || res.statusText || `HTTP ${res.status}`;
      throw new ApiError(msg, { status: res.status, url, body: bodyText });
    }

    if (res.status === 204) return undefined as unknown as T;

    if (looksLikeJson(res.headers)) {
      return (await res.json()) as T;
    }

    const text = await res.text();
    try {
      return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
    } catch {
      // @ts-expect-error allow text for diagnostics in dev
      return text;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms — ${url}`);
    }
    if (err instanceof ApiError) throw err;
    throw new Error(`Network error: ${err?.message || String(err)} — ${url}`);
  } finally {
    clearTimeout(timer);
  }
}

/* ───────────────────────────── helpers ───────────────────────────── */

export const apiGet = <T>(p: string, opts?: { timeoutMs?: number }) =>
  request<T>(p, { method: "GET", ...(opts || {}) });

export const apiPost = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
  request<T>(p, {
    method: "POST",
    body: body == null || body instanceof FormData ? (body as any) : JSON.stringify(body),
    ...(opts || {}),
  });

export const apiPut = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
  request<T>(p, {
    method: "PUT",
    body: body == null || body instanceof FormData ? (body as any) : JSON.stringify(body),
    ...(opts || {}),
  });

export const apiPatch = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
  request<T>(p, {
    method: "PATCH",
    body: body == null || body instanceof FormData ? (body as any) : JSON.stringify(body),
    ...(opts || {}),
  });

export const apiDelete = <T>(p: string, opts?: { timeoutMs?: number }) =>
  request<T>(p, { method: "DELETE", ...(opts || {}) });

/* ───────────────────────────── API surface ───────────────────────────── */
export const apiDeleteJson = <T>(p: string, body?: unknown, opts?: { timeoutMs?: number }) =>
  request<T>(p, {
    method: "DELETE",
    body: body == null || body instanceof FormData ? (body as any) : JSON.stringify(body),
    ...(opts || {}),
  });

export const Me = {
  get: () => apiGet<ProfileMe>("/v1/me"),
};

export const My = {
  locations: () => apiGet<Location[]>("/v1/my/locations"),
};

/** Roles */
export const RolesAPI = {
  options: () => apiGet<RoleKey[]>("/v1/roles"),
  assign: (target_user_id: string, location_id: string, new_role: RoleKey, reason?: string) =>
    apiPost<{ ok: true }>("/v1/roles/location", {
      target_user_id,
      location_id,
      new_role,
      reason,
    }),
  // remove: (target_user_id: string, location_id: string) =>
  //   apiDelete<{ ok: true }>(
  //     `/v1/roles/location?target_user_id=${encodeURIComponent(target_user_id)}&location_id=${encodeURIComponent(location_id)}`
remove: (target_user_id: string, location_id: string) =>
    apiDeleteJson<{ ok: true }>("/v1/roles/location", { target_user_id, location_id }),

};

/** Locations CRUD */
export const Locations = {
  list: () => apiGet<Location[]>("/v1/locations"),
  create: (body: Partial<Location> & { name: string; tz: string }) =>
    apiPost<Location>("/v1/locations", body),
  update: (id: string, body: Partial<Location>) =>
    apiPatch<Location>(`/v1/locations/${id}`, body),
  delete: (id: string) => apiDelete<void>(`/v1/locations/${id}`),
};

/** Users (alias + explicit UsersAPI for imports that expect it) */
// export const UsersAPI = {
//   list: (opts?: ListUsersOptions) =>
//     apiGet<UserWithAssignments[]>(`/v1/users${qs(opts)}`),
//   get: (id: string) => apiGet<UserDetail>(`/v1/users/${id}`),
//   create: (payload: any) => apiPost<any>("/v1/users", payload),
//   update: (id: string, payload: any) => apiPatch<any>(`/v1/users/${id}`, payload),
//   getEmployment: (id: string) =>
//     apiGet<EmploymentRecord[]>(`/v1/users/${id}/employment`),
//   upsertEmployment: (id: string, payload: EmploymentRecord) =>
//     apiPost<any>(`/v1/users/${id}/employment`, payload),
// };

export const UsersAPI = {
  list: (opts?: ListUsersOptions) => apiGet<UserWithAssignments[]>(`/v1/users${qs(opts)}`),
  get: (id: string) => apiGet<any>(`/v1/users/${id}`),
  create: (payload: any) => apiPost<any>("/v1/users", payload),
  update: (id: string, payload: any) => apiPatch<any>(`/v1/users/${id}`, payload),

  // NOTE: GET can be filtered by location_id, PUT for upsert (matches web)
  getEmployment: (id: string, location_id?: string) =>
    apiGet<EmploymentRecord[]>(`/v1/users/${id}/employment${qs({ location_id })}`),
  upsertEmployment: (id: string, payload: EmploymentRecord) =>
    apiPut<any>(`/v1/users/${id}/employment`, payload),
};

/** Keep older imports working: `import { Users } from "../lib/api"` */
export const Users = UsersAPI;

/* ───────────────────────────── debug helpers ───────────────────────────── */

export async function pingApiHealth() {
  try {
    const res = await fetch(toUrl("/health"));
    const txt = await res.text();
    console.log("API /health ->", res.status, txt);
  } catch (e) {
    console.log("API /health failed ->", e);
  }
}
