import { View, Text, StyleSheet } from "react-native";

interface ClipStatusProps {
  nickname: string;
  isActive: boolean;
  isWaiting: boolean;
  error: string | null;
}

export function ClipStatus({ nickname, isActive, isWaiting, error }: ClipStatusProps) {
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Audio no disponible</Text>
      </View>
    );
  }

  let label = "Esperando tarareo...";
  let icon = "⏳";
  if (isWaiting && !isActive) {
    label = `${nickname} está grabando...`;
    icon = "🎤";
  } else if (isActive) {
    label = `Escuchando a ${nickname}`;
    icon = "👂";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
