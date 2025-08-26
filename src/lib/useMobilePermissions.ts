import { useQuery } from "@tanstack/react-query";
import { Me, type RoleKey } from "../lib/api";
import { useActiveLocation } from "./activeLocation";

/**
 * Role gating driven by the *active location*.
 * - Admin → full access, including when "All locations" is selected
 * - Manager at the *active* location → can manage Users & Locations
 * - Everyone else (Cashier/Server/View Only, or no role) → no privileged pages
 */
export function useMobilePermissions() {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: Me.get });
  const { myLocations = [], activeId } = useActiveLocation();

  const isAdmin = !!me?.is_global_admin;

  // Guard: only trust roles from /v1/my/locations (NOT Locations.list)
  const roleAtActive: RoleKey | null =
    activeId ? (myLocations.find((l) => l.id === activeId)?.my_role ?? null) : null;

  const isManagerAtActive = roleAtActive === "MANAGER";

  // “All locations” (activeId null): only Admin keeps privileged access
  const canUsers = isAdmin || isManagerAtActive;
  const canLocations = isAdmin || isManagerAtActive;

  return { isAdmin, roleAtActive, isManagerAtActive, canUsers, canLocations };
}

// Optional: tiny label helper if you want to show a badge somewhere
export function roleLabel(role: RoleKey | null | undefined) {
  if (!role) return "No role";
  return role[0] + role.slice(1).toLowerCase();
}
