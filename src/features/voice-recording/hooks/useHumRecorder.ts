import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { uploadClipBase64, uriToBase64 } from "../../../shared/lib/clip-upload";
import { socket } from "../../../shared/lib/socket-client";

export type RecordPhase =
  | "idle"
  | "countdown"
  | "recording"
  | "uploading"
  | "sent"
  | "error";

const MAX_RECORD_MS = 20_000;

export function useHumRecorder(roomCode: string, enabled: boolean) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  const recorderState = useAudioRecorderState(recorder, 200);
  const [phase, setPhase] = useState<RecordPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setPhase("idle");
      setError(null);
      setCountdown(0);
      finishingRef.current = false;
    }
  }, [enabled]);

  const clearMaxTimer = () => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  };

  const finishAndUpload = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    clearMaxTimer();

    try {
      setPhase("uploading");
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("no_recording_uri");

      const base64 = await uriToBase64(uri);
      const { clipId, clipUrl } = await uploadClipBase64(roomCode, base64, "audio/m4a");

      socket.emit("clip_uploaded", { roomCode, clipId, clipUrl });
      setPhase("sent");
    } catch (e: any) {
      setError(e?.message || "upload_failed");
      setPhase("error");
      finishingRef.current = false;
    }
  }, [recorder, roomCode]);

  const startTake = useCallback(async () => {
    if (!enabled || phase === "recording" || phase === "uploading" || phase === "sent") {
      return;
    }
    setError(null);
    finishingRef.current = false;

    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError("Necesitamos el micrófono para tararear");
        setPhase("error");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      setPhase("countdown");
      for (let c = 3; c >= 1; c--) {
        setCountdown(c);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(0);

      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase("recording");

      maxTimerRef.current = setTimeout(() => {
        void finishAndUpload();
      }, MAX_RECORD_MS);
    } catch (e: any) {
      setError(e?.message || "record_failed");
      setPhase("error");
    }
  }, [enabled, phase, recorder, finishAndUpload]);

  const stopTake = useCallback(() => {
    if (phase !== "recording") return;
    void finishAndUpload();
  }, [phase, finishAndUpload]);

  const metering = recorderState.metering ?? -160;
  const level = Math.max(0, Math.min(1, (metering + 50) / 50));

  return {
    phase,
    error,
    countdown,
    isRecording: phase === "recording",
    meteringLevel: phase === "recording" ? level : 0,
    startTake,
    stopTake,
  };
}
