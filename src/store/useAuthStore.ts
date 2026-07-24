import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NICKNAME_KEY = "humclash_nickname";

interface AuthState {
  nickname: string | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  setNickname: (name: string) => Promise<void>;
  clearNickname: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  nickname: null,
  loading: true,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(NICKNAME_KEY);
    set({ nickname: stored, loading: false });
  },

  setNickname: async (name: string) => {
    await AsyncStorage.setItem(NICKNAME_KEY, name);
    set({ nickname: name });
  },

  clearNickname: async () => {
    await AsyncStorage.removeItem(NICKNAME_KEY);
    set({ nickname: null });
  },
}));
