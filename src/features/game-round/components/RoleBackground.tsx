import { StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

interface RoleBackgroundProps {
  role: "hummer" | "guesser";
  children: React.ReactNode;
}

export function RoleBackground({ role, children }: RoleBackgroundProps) {
  const roleValue = useSharedValue(role === "hummer" ? 0 : 1);

  useEffect(() => {
    roleValue.value = withTiming(role === "hummer" ? 0 : 1, { duration: 600 });
  }, [role]);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      roleValue.value,
      [0, 1],
      ["#0A0A2E", "#2E0A0A"],
    ),
  }));

  return (
    <Animated.View style={[styles.container, bgStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
