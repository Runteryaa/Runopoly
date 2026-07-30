import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const SOCKET_URL = `https://runwatch.qzz.io`;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  ...(Platform.OS !== 'web' ? { transports: ['websocket'] } : {})
});
