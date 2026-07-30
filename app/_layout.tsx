import { Stack } from "expo-router";
import "../global.css";
import { CustomAlertModal } from "../components/CustomAlertModal";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <CustomAlertModal />
    </>
  );
}
