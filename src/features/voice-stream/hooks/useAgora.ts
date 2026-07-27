import { useEffect, useRef, useState, useCallback } from "react";
import { Platform, PermissionsAndroid } from "react-native";
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

function logErr(label: string, err: any) {
  const msg = err?.message ?? String(err);
  console.error(`[agora] ${label}: ${msg}`, err);
}

function rc(engine: any, label: string, ret: any) {
  const code = typeof ret === "number" ? ret : "(non-number)";
  if (typeof ret === "number" && ret < 0) {
    console.error(`[agora] ${label} -> rc=${ret}`);
  } else {
    console.log(`[agora] ${label} -> rc=${code}`);
  }
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
  const isConnectingRef = useRef(false);
  const pendingRoleRef = useRef<"hummer" | "guesser" | null>(null);

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
      applyRole(role).catch((e) => logErr("applyRole effect", e));
    }
  }, [role]);

  const requestMicPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        "android.permission.RECORD_AUDIO",
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
      logErr("requestMicPermission", e);
      return false;
    }
  };

  const applyRole = async (currentRole: "hummer" | "guesser") => {
    if (!engineRef.current) {
      console.warn("[agora] applyRole skipped — engine not ready");
      pendingRoleRef.current = currentRole;
      return;
    }
    try {
      const { ClientRoleType } = require("react-native-agora");
      const clientRole =
        currentRole === "hummer"
          ? ClientRoleType.ClientRoleBroadcaster
          : ClientRoleType.ClientRoleAudience;
      console.log(`[agora] applyRole -> ${currentRole} (role=${clientRole})`);
      const r1 = engineRef.current.setClientRole(clientRole);
      rc(engineRef.current, "setClientRole", r1);
      const shouldMute = currentRole !== "hummer";
      const r2 = engineRef.current.enableLocalAudio(!shouldMute);
      rc(engineRef.current, "enableLocalAudio", r2);
      const r3 = engineRef.current.muteLocalAudioStream(shouldMute);
      rc(engineRef.current, "muteLocalAudioStream", r3);
      setIsMuted(shouldMute);
    } catch (e) {
      logErr("applyRole", e);
    }
  };

  const connect = async (data: AgoraTokenData) => {
    if (isConnectingRef.current) {
      console.log("[agora] connect skipped — already connecting");
      return;
    }
    isConnectingRef.current = true;

    try {
      const shouldMute = data.role !== "publisher";
      console.log(
        `[agora] connect — role=${data.role}, uid=${data.uid}, ch=${data.channel}, shouldMute=${shouldMute}, engineExists=${!!engineRef.current}`,
      );

      if (!engineRef.current) {
        await createEngineAndJoin(data, shouldMute);
      } else {
        await updateSession(data, shouldMute);
      }
    } catch (err: any) {
      logErr("connect", err);
      if (err?.message?.includes("Cannot find module")) {
        setError("Agora SDK not available — voice disabled");
      } else {
        setError(err?.message || "Failed to initialize Agora");
      }
    } finally {
      isConnectingRef.current = false;
    }
  };

  const createEngineAndJoin = async (data: AgoraTokenData, shouldMute: boolean) => {
    const {
      createAgoraRtcEngine,
      ChannelProfileType,
      ClientRoleType,
      AudioScenarioType,
    } = require("react-native-agora");

    const micGranted = await requestMicPermission();
    if (!micGranted) {
      setError("Se necesita permiso del micrófono para tararear");
      return;
    }

    const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID || "";
    console.log(
      `[agora] appId length=${appId.length}, env present=${!!process.env.EXPO_PUBLIC_AGORA_APP_ID}`,
    );
    if (!appId) {
      setError("EXPO_PUBLIC_AGORA_APP_ID no está configurado");
      return;
    }

    if (Platform.OS === "android") {
      console.warn(
        "[agora] ADVERTENCIA: si estás en emulador, el audio de Agora no funciona de forma confiable (sin micrófono real, routing de audio virtual falla). Testear en dispositivo físico.",
      );
    }

    const engine = createAgoraRtcEngine();
    engineRef.current = engine;
    console.log("[agora] engine created");

    engine.registerEventHandler({
      onJoinChannelSuccess: (_connection: any, elapsed: number) => {
        console.log(`[agora] EVENT onJoinChannelSuccess elapsed=${elapsed}`);
        setIsJoined(true);
      },
      onUserJoined: (_connection: any, _uid: number) => {
        console.log(`[agora] EVENT onUserJoined uid=${_uid}`);
        setRemoteAudioLevel(0.3);
      },
      onUserOffline: (_connection: any, _uid: number, _reason: number) => {
        console.log(`[agora] EVENT onUserOffline uid=${_uid} reason=${_reason}`);
        setRemoteAudioLevel(0);
      },
      onLocalAudioStateChanged: (
        _connection: any,
        state: number,
        _error: number,
      ) => {
        console.log(
          `[agora] EVENT onLocalAudioStateChanged state=${state} err=${_error}`,
        );
        setIsSpeaking(state === 1 || state === 2);
      },
      onRemoteAudioStateChanged: (
        _connection: any,
        _uid: number,
        state: number,
        _reason: number,
      ) => {
        console.log(
          `[agora] EVENT onRemoteAudioStateChanged uid=${_uid} state=${state} reason=${_reason}`,
        );
        setRemoteAudioLevel(state === 2 ? 1 : state === 1 ? 0.5 : 0);
      },
      onError: (err: number, msg: string) => {
        console.error(`[agora] EVENT onError ${err}: ${msg}`);
        setError(`Agora error ${err}: ${msg}`);
      },
    });

    const initRet = engine.initialize({
      appId,
      channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      audioScenario: AudioScenarioType.AudioScenarioGameStreaming,
    });
    rc(engine, "initialize", initRet);

    const rProf = engine.setChannelProfile(
      ChannelProfileType.ChannelProfileLiveBroadcasting,
    );
    rc(engine, "setChannelProfile", rProf);

    const rEnableAudio = engine.enableAudio();
    rc(engine, "enableAudio", rEnableAudio);

    const clientRole =
      data.role === "publisher"
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
    const rSetRole = engine.setClientRole(clientRole);
    rc(engine, "setClientRole", rSetRole);

    console.log(
      `[agora] joinChannel tokenLen=${data.token?.length ?? 0} channel=${data.channel} uid=${data.uid}`,
    );
    const joinRet = await engine.joinChannel(data.token, data.channel, data.uid, {
      publishMicrophoneTrack: data.role === "publisher",
      autoSubscribeAudio: true,
    });
    rc(engine, "joinChannel", joinRet);

    const rEnableLocal = engine.enableLocalAudio(data.role === "publisher");
    rc(engine, "enableLocalAudio", rEnableLocal);

    const rMute = engine.muteLocalAudioStream(shouldMute);
    rc(engine, "muteLocalAudioStream", rMute);

    setIsInitialized(true);
    setIsMuted(shouldMute);
    console.log(
      `[agora] joined channel, localAudio=${data.role === "publisher"}, muteLocal=${shouldMute}`,
    );

    if (pendingRoleRef.current) {
      const pending = pendingRoleRef.current;
      pendingRoleRef.current = null;
      applyRole(pending).catch((e) => logErr("applyRole pending", e));
    }
  };

  const updateSession = async (data: AgoraTokenData, shouldMute: boolean) => {
    const { ClientRoleType } = require("react-native-agora");

    const engine = engineRef.current;
    console.log(`[agora] updateSession — role=${data.role}, shouldMute=${shouldMute}`);

    const rRenew = engine.renewToken(data.token);
    rc(engine, "renewToken", rRenew);

    const clientRole =
      data.role === "publisher"
        ? ClientRoleType.ClientRoleBroadcaster
        : ClientRoleType.ClientRoleAudience;
    console.log(
      `[agora] setClientRole to ${
        clientRole === ClientRoleType.ClientRoleBroadcaster
          ? "Broadcaster"
          : "Audience"
      }`,
    );
    const rSetRole = engine.setClientRole(clientRole);
    rc(engine, "setClientRole", rSetRole);

    const rEnable = engine.enableLocalAudio(data.role === "publisher");
    rc(engine, "enableLocalAudio", rEnable);

    const rMute = engine.muteLocalAudioStream(shouldMute);
    rc(engine, "muteLocalAudioStream", rMute);

    setIsMuted(shouldMute);
    console.log(
      `[agora] updateSession done — role=${data.role}, localAudio=${data.role === "publisher"}, muteLocal=${shouldMute}`,
    );
  };

  const leaveChannel = () => {
    try {
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
      setIsInitialized(false);
      setIsJoined(false);
    } catch (e) {
      logErr("leaveChannel", e);
    }
  };

  const toggleMute = useCallback(() => {
    try {
      const newMuted = !isMuted;
      engineRef.current?.muteLocalAudioStream(newMuted);
      setIsMuted(newMuted);
    } catch (e) {
      logErr("toggleMute", e);
    }
  }, [isMuted]);

  const setMuted = useCallback((muted: boolean) => {
    try {
      engineRef.current?.muteLocalAudioStream(muted);
      setIsMuted(muted);
    } catch (e) {
      logErr("setMuted", e);
    }
  }, []);

  const muteRemote = useCallback(() => {
    try {
      engineRef.current?.muteAllRemoteAudioStreams(true);
    } catch (e) {
      logErr("muteRemote", e);
    }
  }, []);

  const unmuteRemote = useCallback(() => {
    try {
      engineRef.current?.muteAllRemoteAudioStreams(false);
    } catch (e) {
      logErr("unmuteRemote", e);
    }
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