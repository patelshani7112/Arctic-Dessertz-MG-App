import { useQuery } from "@tanstack/react-query";
import { Me, Users, type ProfileMe, type UserDetail } from "../lib/api";

export function useMyProfile() {
  const meQ = useQuery<ProfileMe>({ queryKey: ["me"], queryFn: Me.get });
  const detailQ = useQuery<UserDetail>({
    queryKey: ["me:detail", meQ.data?.user_id],
    queryFn: () => Users.get(meQ.data!.user_id),
    enabled: !!meQ.data?.user_id,
  });

  return {
    me: meQ.data,
    detail: detailQ.data,
    loading: meQ.isLoading || detailQ.isLoading,
    error: (meQ.error as Error) || (detailQ.error as Error) || null,
  };
}
