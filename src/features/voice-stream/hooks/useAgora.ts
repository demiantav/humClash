import { useEffect, useRef, useState, useCallback } from "react";
import { socket } from "../../../shared/lib/socket-client";

interface AgoraTokenData {
  token: string;
  channel: string;
  uid: number;
  role: "publisher" | "subscriber";
}

interface UseAgoraResult {
  isInitialized: boolean;
  isJoined: boolean;
  isMuted: boolean;
  isSpeaking: boolean;
  remoteAudioLevel: number;
  error: string | null;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export function useAgora(
  roomCode: string,
  role: "hummer" | "guesser",
): UseAgoraResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(role !== "hummer");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<any>(null);
  const tokenRef = useRef<AgoraTokenData | null>(null);

  useEffect(() => {
    socket.on("agora_token", (data: AgoraTokenData) => {
      tokenRef.current = data;
      connect(data);
    });

    socket.emit("request_agora_token", { roomCode });

    return () => {
      socket.off("agora_token");
      leaveChannel();
    };
  }, [roomCode]);

  useEffect(() => {
    if (tokenRef.current) {
      connect(tokenRef.current);
    }
  }, [role]);

  const connect = async (data: AgoraTokenData) => {
    try {
      const { createAgoraRtcEngine, ChannelProfileType, ClientRoleType, AudioScenarioType, RtcSurfaceView } = require("react-native-agora");

      if (engineRef.current) {
        engineRef.current.release();
      }

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          setIsJoined(true);
        },
        onLocalAudioStateChanged: (_connection: any, state: number, _error: number) => {
          setIsSpeaking(state === 1 || state === 2);
          if (state === 1 && data.role === "publisher") {
            setIsSpeaking(true);
          }
        },
        onRemoteAudioStateChanged: (_connection: any, _uid: number, state: number, _reason: number) => {
          setRemoteAudioLevel(state === 2 ? 1 : state === 1 ? 0.5 : 0);
        },
        onError: (err: number, msg: string) => {
          setError(`Agora error ${err}: ${msg}`);
        },
      });

      engine.initialize({
        appId: process.env.EXPO_PUBLIC_AGORA_APP_ID || "",
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
        audioScenario: AudioScenarioType.AudioScenarioGameStreaming,
      });

      engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      engine.enableAudio();

      const clientRole = data.role === "publisher"
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
      engine.setClientRole(clientRole);

      engine.joinChannel(data.token, data.channel, data.uid, {
        publishMicrophoneTrack: data.role === "publisher",
        autoSubscribeAudio: true,
      });

      const shouldMute = role !== "hummer" || data.role !== "publisher";
      engine.muteLocalAudioStream(shouldMute);
      setIsMuted(shouldMute);

      setIsInitialized(true);
    } catch (err: any) {
      if (err.message?.includes("Cannot find module")) {
        setError("Agora SDK not available — voice disabled");
      } else {
        setError(err.message || "Failed to initialize Agora");
      }
    }
  };

  const leaveChannel = () => {
    try {
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
      setIsInitialized(false);
      setIsJoined(false);
    } catch {}
  };

  const toggleMute = useCallback(() => {
    try {
      const newMuted = !isMuted;
      engineRef.current?.muteLocalAudioStream(newMuted);
      setIsMuted(newMuted);
    } catch {}
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    try {
      engineRef.current?.muteLocalAudioStream(muted);
      setIsMuted(muted);
    } catch {}
  }, []);

  return {
    isInitialized,
    isJoined,
    isMuted,
    isSpeaking,
    remoteAudioLevel,
    error,
    toggleMute,
    setMuted,
  };
}
