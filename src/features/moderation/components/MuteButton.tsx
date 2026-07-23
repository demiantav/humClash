import { Pressable, Text, StyleSheet } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";

interface MuteButtonProps {
  roomCode: string;
  targetNickname: string;
}

export function MuteButton({ roomCode: _roomCode, targetNickname: _targetNickname }: MuteButtonProps) {
  const [muted, setMuted] = useState(false);

  const handleToggle = () => {
    setMuted(!muted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Pressable
      style={[styles.button, muted && styles.muted]}
      onPress={handleToggle}
      hitSlop={8}
    >
      <Text style={styles.icon}>{muted ? "🔇" : "🔊"}</Text>
    </Pressable>
  );
}

interface ReportButtonProps {
  roomCode: string;
  targetNickname: string;
}

export function ReportButton({ roomCode, targetNickname: _targetNickname }: ReportButtonProps) {
  const [reported, setReported] = useState(false);
  const { socket } = require("../../shared/lib/socket-client");

  const handleReport = () => {
    if (reported) return;
    setReported(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    socket.emit("report_player", { roomCode, reason: "other" } as any);
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handleReport}
      hitSlop={8}
      disabled={reported}
    >
      <Text style={styles.icon}>{reported ? "✓" : "🚩"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  muted: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
  },
  icon: {
    fontSize: 18,
  },
});
