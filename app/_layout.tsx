import { Stack } from "expo-router";
import "../global.css";
import { CustomAlertModal } from "../components/CustomAlertModal";
import { useEffect } from "react";
import { socket } from "../utils/socket";
import { CustomAlert } from "../utils/alert";

export default function RootLayout() {
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
