import * as React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { Me, My, type Location } from "../lib/api";

type Ctx = {
  activeId: string | null;                // null = “All locations”
  setActiveId: (id: string | null) => void;
  myLocations: Location[];
  loading: boolean;
  isAdmin: boolean;
};

const ActiveLocationContext = React.createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = "activeLocationId";

export function ActiveLocationProvider({ children }: { children: React.ReactNode }) {
  // who am i (for is_global_admin)
  const meQ = useQuery({ queryKey: ["me"], queryFn: Me.get });
  // my locations
  const locQ = useQuery<Location[]>({ queryKey: ["my:locations"], queryFn: My.locations });

  const [activeId, setActiveIdState] = React.useState<string | null>(null);

  // load saved id once
  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) setActiveIdState(saved || null); // "" => null
      } catch {}
    })();
  }, []);

  // ensure activeId is valid whenever myLocations load/refresh
  React.useEffect(() => {
    const list = locQ.data || [];
    if (!list.length) return;
    if (activeId && !list.some((l) => l.id === activeId)) {
      setActiveIdState(null); // fallback to All/none
    }
  }, [locQ.data]); // eslint-disable-line

  const setActiveId = React.useCallback(async (id: string | null) => {
    setActiveIdState(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, id ?? "");
    } catch {}
  }, []);

  const value: Ctx = {
    activeId,
    setActiveId,
    myLocations: locQ.data || [],
    loading: meQ.isLoading || locQ.isLoading,
    isAdmin: !!meQ.data?.is_global_admin,
  };

  return (
    <ActiveLocationContext.Provider value={value}>
      {children}
    </ActiveLocationContext.Provider>
  );
}

export function useActiveLocation() {
  const ctx = React.useContext(ActiveLocationContext);
  if (!ctx) throw new Error("useActiveLocation must be used within ActiveLocationProvider");
  return ctx;
}
