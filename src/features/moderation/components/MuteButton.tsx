import { Pressable, Text, StyleSheet } from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";

interface MuteButtonProps {
  roomCode: string;
  targetNickname: string;
  onMuteRemote: () => void;
  onUnmuteRemote: () => void;
}

export function MuteButton({ roomCode: _roomCode, targetNickname: _targetNickname, onMuteRemote, onUnmuteRemote }: MuteButtonProps) {
  const [muted, setMuted] = useState(false);

  const handleToggle = () => {
    const next = !muted;
    setMuted(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (next) {
      onMuteRemote();
    } else {
      onUnmuteRemote();
    }
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
  onReport?: () => void;
}

export function ReportButton({ roomCode, targetNickname: _targetNickname, onReport }: ReportButtonProps) {
  const [reported, setReported] = useState(false);

  const handleReport = () => {
    if (reported) return;
    setReported(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onReport?.();
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
