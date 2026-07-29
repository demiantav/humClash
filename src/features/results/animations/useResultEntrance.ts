import { useEffect } from "react";
import { useSharedValue, useAnimatedStyle, withSequence, withSpring } from "react-native-reanimated";

export function useResultEntrance(triggerKey: unknown) {
  const scale = useSharedValue(0.6);
  const translateY = useSharedValue(24);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.18, { stiffness: 240, damping: 10 }),
      withSpring(1, { stiffness: 200, damping: 14 }),
    );
    translateY.value = withSpring(0, { stiffness: 180, damping: 16 });
  }, [triggerKey]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return { entranceStyle: style };
}