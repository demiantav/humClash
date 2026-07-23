import { View, Text, StyleSheet } from "react-native";

interface RoundProgressDotsProps {
  currentRound: number;
  totalRounds: number;
  roundResults: (boolean | null)[];
}

export function RoundProgressDots({ currentRound, totalRounds, roundResults }: RoundProgressDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalRounds }, (_, i) => {
        const roundIdx = i;
        const isPast = roundIdx < currentRound - 1;
        const isCurrent = roundIdx === currentRound - 1;
        const result = roundResults[roundIdx];

        return (
          <View key={i} style={styles.dotContainer}>
            <View
              style={[
                styles.dot,
                isCurrent && styles.dotCurrent,
                isPast && result === true && styles.dotCorrect,
                isPast && result === false && styles.dotIncorrect,
                isPast && result === null && styles.dotTimeout,
              ]}
            />
            {isCurrent && (
              <View style={styles.glow} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2D2B3E",
    borderWidth: 1,
    borderColor: "#3D3B4E",
  },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C4DFF",
    borderColor: "#A78BFA",
  },
  dotCorrect: {
    backgroundColor: "#00D4AA",
    borderColor: "#00D4AA",
  },
  dotIncorrect: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  dotTimeout: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
  },
  glow: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(124, 77, 255, 0.3)",
  },
});
