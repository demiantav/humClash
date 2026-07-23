import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function ResultsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Resultados</Text>
      <Text style={styles.placeholder}>La pantalla de resultados se implementa en Fase 5</Text>
      <Pressable style={styles.button} onPress={() => router.replace("/")}>
        <Text style={styles.buttonText}>Volver al Inicio</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1A",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FFD700",
    marginBottom: 16,
  },
  placeholder: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#7C4DFF",
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
  },
});
