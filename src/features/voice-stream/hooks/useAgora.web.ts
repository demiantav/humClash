import { useEffect, useRef, useState, useCallback } from "react";

interface UseAgoraResult {
  isInitialized: boolean;
  isJoined: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  remoteAudioLevel: number;
  error: string | null;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  muteRemote: () => void;
  unmuteRemote: () => void;
}

export function useAgora(
  _roomCode: string,
  _role: "hummer" | "guesser",
): UseAgoraResult {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  const muteRemote = useCallback(() => {}, []);
  const unmuteRemote = useCallback(() => {}, []);

  return {
    isInitialized: false,
    isJoined: false,
    isMuted,
    isSpeaking: false,
    remoteAudioLevel: 0,
    error: "Voz no disponible en web",
    toggleMute,
    setMuted: setIsMuted,
    muteRemote,
    unmuteRemote,
  };
}
