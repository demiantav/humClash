import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Pressable } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OptionButtonProps {
  title: string;
  artist: string;
  onPress: () => void;
  disabled?: boolean;
  state?: "idle" | "correct" | "incorrect";
}

export function OptionButton({
  title,
  artist,
  onPress,
  disabled = false,
  state = "idle",
}: OptionButtonProps) {
  const scale = useSharedValue(1);
  const bgColor = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    let bg = "#1E1B2E";
    if (state === "correct") bg = "#00D4AA33";
    else if (state === "incorrect") bg = "#FF6B6B33";

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bg,
      borderColor:
        state === "correct"
          ? "#00D4AA"
          : state === "incorrect"
            ? "#FF6B6B"
            : "#2D2B3E",
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(0.96, { stiffness: 400, damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, { stiffness: 200, damping: 12 });
    onPress();
  };

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {artist}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    padding: 14,
    justifyContent: "center",
    borderWidth: 2,
    minWidth: 48,
  },
  title: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  artist: {
    color: "#888",
    fontSize: 13,
  },
});
