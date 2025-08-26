// Robust name helpers: handle missing metadata + email fallback.

export type NameParts = { first: string; last: string; full: string; initials: string };

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");

export function namePartsFromStrings(fullName?: string, email?: string): NameParts {
  const emailStr = (typeof email === "string" ? email : "").trim();
  let full = (typeof fullName === "string" ? fullName : "").trim();

  if (!full) {
    // derive from email handle, e.g. "s.paaaaaa" -> "s paaaaa"
    const handle = (emailStr.split("@")[0] || "").replace(/[._-]/g, " ");
    full = handle;
  }

  const parts = full.split(/\s+/).filter(Boolean);
  const first = cap(parts[0] || "");
  const last = parts.length > 1 ? parts.slice(1).join(" ") : "";
  const initials = (
    (parts[0]?.[0] || emailStr[0] || "?") +
    (parts.length > 1 ? parts[parts.length - 1][0] : "")
  ).toUpperCase();

  return { first, last, full: [first, last].filter(Boolean).join(" "), initials };
}

export function namePartsFromUser(user: any): NameParts {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fullFromMeta =
    // common fields from different providers/your app
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    ((typeof meta.given_name === "string" || typeof meta.family_name === "string")
      ? [meta.given_name as string, meta.family_name as string].filter(Boolean).join(" ")
      : "") ||
    ((typeof meta.first_name === "string" || typeof meta.last_name === "string")
      ? [meta.first_name as string, meta.last_name as string].filter(Boolean).join(" ")
      : "");

  return namePartsFromStrings(fullFromMeta, user?.email ?? "");
}

// Back-compat exports (if any files still import these)
export const firstNameFrom = (name?: string, email?: string) => namePartsFromStrings(name, email).first;
export const initialsFrom  = (name?: string, email?: string) => namePartsFromStrings(name, email).initials;
export const firstNameOf   = firstNameFrom;
