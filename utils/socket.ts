import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = `https://runopoly.ddns.net`;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});
