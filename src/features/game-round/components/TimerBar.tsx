import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";
import { estimateElapsed } from "../../../shared/lib/timerSync";

interface TimerBarProps {
  timeLeft: number;
  timeLimit: number;
  secondsElapsed: number;
  serverTimestamp: number;
  critical?: boolean;
}

export function TimerBar({
  timeLeft: _timeLeft,
  timeLimit,
  secondsElapsed,
  serverTimestamp,
  critical: _critical,
}: TimerBarProps) {
  const progress = useSharedValue(1);
  const flash = useSharedValue(0);

  useEffect(() => {
    const elapsed = estimateElapsed(secondsElapsed, serverTimestamp);
    const ratio = Math.max(0, 1 - elapsed / timeLimit);
    const remainingMs = Math.max(0, ratio * timeLimit * 1000);

    progress.value = withTiming(ratio, {
      duration: Math.min(remainingMs, 1000),
      easing: Easing.linear,
    });

    if (ratio < 0.3) {
      flash.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0, { duration: 150 }),
        ),
        Math.floor(remainingMs / 300),
        false,
      );
    }
  }, [secondsElapsed, serverTimestamp, timeLimit]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.3, 0.6, 1],
      ["#FF0000", "#FF6B35", "#FFD700", "#00D4AA"],
    ),
    opacity: progress.value < 0.3 ? 0.5 + flash.value * 0.5 : 1,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    borderColor:
      progress.value < 0.1
        ? withTiming(flash.value ? "#FF0000" : "#FF000044", { duration: 150 })
        : "#2D2B3E",
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.fill, barStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 8,
    backgroundColor: "#1E1B2E",
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
