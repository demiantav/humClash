import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NICKNAME_KEY = "humclash_nickname";

export function useGuestAuth() {
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NICKNAME_KEY).then((stored) => {
      setNicknameState(stored);
      setLoading(false);
    });
  }, []);

  const setNickname = useCallback(async (name: string) => {
    await AsyncStorage.setItem(NICKNAME_KEY, name);
    setNicknameState(name);
  }, []);

  const clearNickname = useCallback(async () => {
    await AsyncStorage.removeItem(NICKNAME_KEY);
    setNicknameState(null);
  }, []);

  return { nickname, setNickname, clearNickname, loading, hasNickname: nickname !== null };
}
