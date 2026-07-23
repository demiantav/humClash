import { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

export function useScreenShake() {
  const shake = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const decay = 1 - shake.value;
    const intensity = 10;
    return {
      transform: [
        {
          translateX:
            Math.sin(shake.value * 14) * intensity * decay,
        },
        {
          translateY:
            Math.cos(shake.value * 12) * intensity * 0.6 * decay,
        },
      ],
    };
  });

  const trigger = (intensity?: number) => {
    shake.value = 0;
    shake.value = withTiming(1, {
      duration: 400 + (intensity ?? 0) * 20,
      easing: Easing.out(Easing.ease),
    });
  };

  return { animatedStyle, trigger };
}
