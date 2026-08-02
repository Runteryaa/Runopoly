import { Stack } from "expo-router";
import "../global.css";
import { CustomAlertModal } from "../components/CustomAlertModal";
import { useEffect } from "react";
import { socket } from "../utils/socket";
import { CustomAlert } from "../utils/alert";
import { useFonts } from "expo-font";
import { View } from "react-native";

export default function RootLayout() {
  // Load vector icon fonts explicitly — required for web
  // Without this, icons render as squares on web before fonts load
  const [fontsLoaded] = useFonts({
    MaterialCommunityIcons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf"),
  });

  useEffect(() => {
    socket.on('server_message', (msg) => {
      CustomAlert.alert('Sistem Duyurusu', msg);
    });
    return () => {
      socket.off('server_message');
    };
  }, []);

  // Block rendering until fonts are ready — prevents icon squares on web
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#18181b' }} />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <CustomAlertModal />
    </>
  );
}
