

// apps/mobile/src/lib/activeLocation.tsx
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Me, My, type RoleKey, type Location } from "../lib/api";

type MyLoc = Location & {
  my_role?: RoleKey | null;
  // If your API also returns a position per user/location, expose it here:
  position_title?: string | null;
};

type Ctx = {
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  myLocations: MyLoc[];
  loading: boolean;
  isAdmin: boolean;
  activeRole: RoleKey | null;
};

const ActiveLocationContext = React.createContext<Ctx | null>(null);

export function ActiveLocationProvider({ children }: { children: React.ReactNode }) {
  // Persist activeId in-memory (you can wire AsyncStorage later if you wish)
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Who am I? (for admin)
  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get, staleTime: 0, refetchOnMount: "always" });

  // SOURCE OF TRUTH for roles: /v1/my/locations
  const myLocQ = useQuery({
    queryKey: ["my:locations"],
    queryFn: My.locations,
    // force fresh, prevent stale role bugs
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  const myLocations = React.useMemo(() => {
    const rows = (myLocQ.data || []) as MyLoc[];
    // Normalize server glitches defensively
    return rows.map((l) => ({
      ...l,
      my_role: (l.my_role ?? null) as RoleKey | null,
      position_title: (l as any).position_title ?? null,
    }));
  }, [myLocQ.data]);

  // Role for the currently active location
  const activeRole: RoleKey | null = React.useMemo(() => {
    if (!activeId) return null;
    const row = myLocations.find((l) => l.id === activeId);
    return (row?.my_role ?? null) as RoleKey | null;
  }, [activeId, myLocations]);

  const value: Ctx = {
    activeId,
    setActiveId,
    myLocations,
    loading: myLocQ.isLoading,
    isAdmin: !!meQ.data?.is_global_admin,
    activeRole,
  };

  return (
    <ActiveLocationContext.Provider value={value}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation(): Ctx {
  const ctx = React.useContext(ActiveLocationContext);
  if (!ctx) throw new Error("useActiveLocation must be used within ActiveLocationProvider");
  return ctx;
}
