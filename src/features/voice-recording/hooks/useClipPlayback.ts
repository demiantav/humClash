import { useCallback, useEffect, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";

export function useClipPlayback(clipUrl: string | null) {
  const player = useAudioPlayer(clipUrl, { downloadFirst: true });
  const status = useAudioPlayerStatus(player);
  const [muted, setMuted] = useState(false);
  const [relistenLeft, setRelistenLeft] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRelistenLeft(1);
    setError(null);
    setMuted(false);
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch(() => {});
  }, [clipUrl]);

  useEffect(() => {
    if (!clipUrl) return;
    try {
      player.volume = muted ? 0 : 1;
      player.play();
    } catch (e: any) {
      setError(e?.message || "playback_failed");
    }
  }, [clipUrl]);

  useEffect(() => {
    player.volume = muted ? 0 : 1;
  }, [muted, player]);

  const mute = useCallback(() => setMuted(true), []);
  const unmute = useCallback(() => setMuted(false), []);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const relisten = useCallback(() => {
    if (relistenLeft <= 0 || !clipUrl) return;
    setRelistenLeft((n) => n - 1);
    void (async () => {
      try {
        await player.seekTo(0);
        player.volume = muted ? 0 : 1;
        player.play();
      } catch (e: any) {
        setError(e?.message || "relisten_failed");
      }
    })();
  }, [relistenLeft, clipUrl, player, muted]);

  return {
    isPlaying: status.playing,
    isLoaded: status.isLoaded,
    muted,
    mute,
    unmute,
    toggleMute,
    relisten,
    relistenLeft,
    error,
    isAudioActive: Boolean(clipUrl) && status.isLoaded,
  };
}
