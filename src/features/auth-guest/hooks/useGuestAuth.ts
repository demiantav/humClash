import { useEffect } from "react";
import { useAuthStore } from "../../../store/useAuthStore";

export function useGuestAuth() {
  const nickname = useAuthStore((s) => s.nickname);
  const loading = useAuthStore((s) => s.loading);
  const hydrate = useAuthStore((s) => s.hydrate);
  const setNickname = useAuthStore((s) => s.setNickname);
  const clearNickname = useAuthStore((s) => s.clearNickname);

  useEffect(() => {
    hydrate();
  }, []);

  return { nickname, setNickname, clearNickname, loading, hasNickname: nickname !== null };
}
