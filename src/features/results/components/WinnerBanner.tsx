import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useResultEntrance } from "../animations/useResultEntrance";

type Outcome = "win" | "lose" | "tie";

interface WinnerBannerProps {
  outcome: Outcome;
  myNickname: string;
  rivalNickname: string;
  myTotal: number;
  rivalTotal: number;
}

function getOutcomeConfig(outcome: Outcome) {
  if (outcome === "win") {
    return {
      title: "¡GANASTE!",
      subtitle: "Te mandaste toda la serie",
      bg: "#1A6B3A",
      accent: "#FFD700",
    };
  }
  if (outcome === "lose") {
    return {
      title: "PERDISTE",
      subtitle: "La próxima es tuya",
      bg: "#7A1820",
      accent: "#FF6B6B",
    };
  }
  return {
    title: "EMPATE",
    subtitle: "¿Desempate?",
    bg: "#3D2E5E",
    accent: "#A78BFA",
  };
}

export function WinnerBanner({
  outcome,
  myNickname,
  rivalNickname,
  myTotal,
  rivalTotal,
}: WinnerBannerProps) {
  const { entranceStyle } = useResultEntrance(outcome);
  const cfg = getOutcomeConfig(outcome);

  return (
    <Animated.View style={[styles.container, { backgroundColor: cfg.bg }, entranceStyle]}>
      <Animated.Text style={[styles.title, { color: cfg.accent }]}>
        {cfg.title}
      </Animated.Text>
      <Animated.Text style={styles.subtitle}>{cfg.subtitle}</Animated.Text>
      <Animated.Text style={styles.score}>
        {myNickname} {myTotal} — {rivalTotal} {rivalNickname}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    opacity: 0.85,
  },
  score: {
    color: "#E5E5E5",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});