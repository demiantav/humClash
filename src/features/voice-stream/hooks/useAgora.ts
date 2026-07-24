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
  muteRemote: () => void;
  unmuteRemote: () => void;
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
  const roleRef = useRef(role);
  roleRef.current = role;

  useEffect(() => {
    const onToken = (data: AgoraTokenData) => {
      tokenRef.current = data;
      connect(data);
    };

    socket.on("agora_token", onToken);

    return () => {
      socket.off("agora_token", onToken);
      leaveChannel();
    };
  }, [roomCode]);

  useEffect(() => {
    if (engineRef.current) {
      applyRole(role);
    }
  }, [role]);

  const applyRole = (currentRole: "hummer" | "guesser") => {
    try {
      const { ClientRoleType } = require("react-native-agora");
      const clientRole = currentRole === "hummer"
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
      engineRef.current.setClientRole(clientRole);

      const shouldMute = currentRole !== "hummer";
      engineRef.current.muteLocalAudioStream(shouldMute);
      setIsMuted(shouldMute);
    } catch {}
  };

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
        onUserJoined: (_connection: any, _uid: number) => {
          setRemoteAudioLevel(0.3);
        },
        onUserOffline: (_connection: any, _uid: number, _reason: number) => {
          setRemoteAudioLevel(0);
        },
        onLocalAudioStateChanged: (_connection: any, state: number, _error: number) => {
          setIsSpeaking(state === 1 || state === 2);
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

      try {
        await engine.joinChannel(data.token, data.channel, data.uid, {
          publishMicrophoneTrack: data.role === "publisher",
          autoSubscribeAudio: true,
        });
        setIsInitialized(true);
      } catch (joinErr: any) {
        setError(joinErr?.message || "Failed to join Agora channel");
        return;
      }

      const shouldMute = roleRef.current !== "hummer" || data.role !== "publisher";
      engine.muteLocalAudioStream(shouldMute);
      setIsMuted(shouldMute);
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

  const muteRemote = useCallback(() => {
    try {
      engineRef.current?.muteAllRemoteAudioStreams(true);
    } catch {}
  }, []);

  const unmuteRemote = useCallback(() => {
    try {
      engineRef.current?.muteAllRemoteAudioStreams(false);
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
    muteRemote,
    unmuteRemote,
  };
}
