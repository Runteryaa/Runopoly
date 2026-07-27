import { io } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL = `http://150.230.154.153:3000`;

export const socket = io(SOCKET_URL, {
  autoConnect: false, 
});
