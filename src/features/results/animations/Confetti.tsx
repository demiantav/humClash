import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const PARTICLE_COUNT = 36;
const COLORS = ["#FFD700", "#FF6B35", "#00D4AA", "#7C4DFF", "#FFB800", "#FF6B6B"];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
  size: number;
  delay: number;
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4;
    const distance = 220 + Math.random() * 280;
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance + 400,
      rotate: Math.random() * 720 - 360,
      color: COLORS[i % COLORS.length],
      size: 8 + Math.random() * 10,
      delay: Math.random() * 250,
    };
  });
}

interface ParticlePieceProps {
  particle: Particle;
  play: boolean;
}

function ParticlePiece({ particle, play }: ParticlePieceProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (play) {
      tx.value = 0;
      ty.value = 0;
      rot.value = 0;
      opacity.value = 0;
      opacity.value = withDelay(particle.delay, withTiming(1, { duration: 80 }));
      tx.value = withDelay(
        particle.delay,
        withSpring(particle.x, { stiffness: 80, damping: 14 }),
      );
      ty.value = withDelay(
        particle.delay,
        withSpring(particle.y, { stiffness: 60, damping: 18 }),
      );
      rot.value = withDelay(
        particle.delay,
        withTiming(particle.rotate, {
          duration: 1600,
          easing: Easing.out(Easing.ease),
        }),
      );
      opacity.value = withDelay(
        particle.delay + 1100,
        withTiming(0, { duration: 700 }),
      );
    }
  }, [play]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rot.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size * 0.5,
          backgroundColor: particle.color,
        },
        style,
      ]}
    />
  );
}

interface ConfettiProps {
  play: boolean;
}

export function Confetti({ play }: ConfettiProps) {
  const particlesRef = buildParticles();

  if (!play) return null;

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {particlesRef.map((p) => (
        <ParticlePiece key={p.id} particle={p} play={play} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  particle: {
    position: "absolute",
    borderRadius: 2,
  },
});