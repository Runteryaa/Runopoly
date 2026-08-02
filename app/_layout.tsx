import { Stack } from "expo-router";
import "../global.css";
import { CustomAlertModal } from "../components/CustomAlertModal";
import { useEffect } from "react";
import { socket } from "../utils/socket";
import { CustomAlert } from "../utils/alert";
import { useFonts } from "expo-font";

export default function RootLayout() {
  // Load vector icon fonts explicitly — required for web
  useFonts({
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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <CustomAlertModal />
    </>
  );
}
