import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { AppState } from "react-native";
import { Me } from "./api";
import { supabase } from "./supabase";

export function useMe() {
  const q = useQuery({
    queryKey: ["me"],
    queryFn: Me.get,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  React.useEffect(() => {
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") q.refetch();
    });
    const auth = supabase.auth.onAuthStateChange(() => q.refetch());
    return () => {
      sub.remove();
      auth.data.subscription.unsubscribe();
    };
  }, [q]);

  return q;
}
