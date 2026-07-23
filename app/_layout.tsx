import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { socket, connectSocket } from "../src/shared/lib/socket-client";
import "../src/shared/lib/socket-client";

export default function RootLayout() {
  useEffect(() => {
    connectSocket();
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "#0F0A1A" },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}
