import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface AudioIndicatorProps {
  level: number;
  isActive: boolean;
}

export function AudioIndicator({ level, isActive }: AudioIndicatorProps) {
  const bars = [0, 1, 2, 3, 4];

  return (
    <View style={styles.row}>
      {bars.map((i) => (
        <AudioBar key={i} index={i} level={level} isActive={isActive} />
      ))}
    </View>
  );
}

function AudioBar({ index, level, isActive }: { index: number; level: number; isActive: boolean }) {
  const height = useSharedValue(4);

  useEffect(() => {
    const threshold = (index + 1) / 5;
    const active = isActive && level >= threshold;
    height.value = withTiming(active ? 8 + index * 4 : 4, { duration: 150 });
  }, [level, isActive, index]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: isActive
      ? level >= (index + 1) / 5
        ? index >= 4
          ? "#FF6B35"
          : index >= 3
            ? "#FFD700"
            : "#00D4AA"
        : "#3D3B4E"
      : "#2D2B3E",
  }));

  return <Animated.View style={[styles.bar, barStyle]} />;
}

interface RemoteAudioStatusProps {
  nickname: string;
  isActive: boolean;
  error: string | null;
}

export function RemoteAudioStatus({ nickname, isActive, error }: RemoteAudioStatusProps) {
  if (error) {
    return (
      <View style={statusStyles.container}>
        <Text style={statusStyles.error}>Voz no disponible</Text>
      </View>
    );
  }

  return (
    <View style={statusStyles.container}>
      <Text style={statusStyles.icon}>{isActive ? "👂" : "🔇"}</Text>
      <Text style={statusStyles.text}>
        {isActive ? `${nickname} te está tarareando` : "Esperando audio..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
    height: 28,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

const statusStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  error: {
    color: "#FF6B6B",
    fontSize: 12,
  },
});
