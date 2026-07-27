import { View, Text, StyleSheet } from "react-native";
import { Song } from "../../../shared/types";

interface RoundRow {
  roundNumber: number;
  song: Song;
  correct: boolean;
  score: number;
  guesserNickname: string;
  timeTaken: number;
}

interface RoundScoreTableProps {
  rounds: RoundRow[];
  myNickname: string;
  rivalNickname: string;
}

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  if (seconds < 1) return `${Math.round(seconds * 10) / 10}s`;
  return `${Math.round(seconds)}s`;
}

export function RoundScoreTable({ rounds, myNickname, rivalNickname }: RoundScoreTableProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.cell, styles.headCell, { flex: 0.4 }]}>#</Text>
        <Text style={[styles.cell, styles.headCell, { flex: 2.2 }]}>Canción</Text>
        <Text style={[styles.cell, styles.headCell, { flex: 1 }]}>Adivinó</Text>
        <Text style={[styles.cell, styles.headCell, { flex: 0.9 }]}>Tiempo</Text>
        <Text style={[styles.cell, styles.headCell, { flex: 0.9, textAlign: "right" }]}>Puntos</Text>
      </View>

      {rounds.map((r, i) => {
        const isMine = r.guesserNickname === myNickname;
        return (
          <View
            key={i}
            style={[styles.row, isMine && styles.rowMine, i % 2 === 1 && styles.rowZebra]}
          >
            <Text style={[styles.cell, { flex: 0.4, fontWeight: "900" }]}>{r.roundNumber}</Text>
            <View style={[styles.songCell, { flex: 2.2 }]}>
              <Text style={styles.songTitle} numberOfLines={1}>{r.song.title}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{r.song.artist}</Text>
            </View>
            <View style={[styles.guessCell, { flex: 1 }]}>
              {r.correct ? (
                <Text style={styles.iconCorrect}>✓</Text>
              ) : (
                <Text style={styles.iconIncorrect}>✕</Text>
              )}
              <Text style={styles.guesserTag}>
                {isMine ? "Vos" : r.guesserNickname === rivalNickname ? "Rival" : r.guesserNickname}
              </Text>
            </View>
            <Text style={[styles.cell, { flex: 0.9 }]}>{formatTime(r.timeTaken)}</Text>
            <Text style={[styles.cell, { flex: 0.9, textAlign: "right", fontWeight: "800" }]}>
              {r.score}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headCell: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    minHeight: 48,
  },
  rowZebra: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  rowMine: {
    backgroundColor: "rgba(0,212,170,0.08)",
  },
  cell: {
    color: "#E5E5E5",
    fontSize: 13,
  },
  songCell: {
    paddingHorizontal: 4,
  },
  songTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  songArtist: {
    color: "#8B8B9A",
    fontSize: 11,
    marginTop: 1,
  },
  iconCorrect: {
    color: "#00D4AA",
    fontSize: 16,
    fontWeight: "900",
  },
  iconIncorrect: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "900",
  },
  guesserTag: {
    color: "#888",
    fontSize: 10,
    marginTop: 1,
  },
  guessCell: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
});