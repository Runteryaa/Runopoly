import { CustomAlert } from '../utils/alert';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useTranslation } from '../utils/i18n';

export default function JoinGame() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const { playerName } = useGameStore();
  const { t } = useTranslation();

  useEffect(() => {
      socket.connect();
      socket.on('random_lobby_found', (lobbyCode) => {
          router.push({ pathname: '/lobby', params: { code: lobbyCode, isHost: 'false' } });
      });
      socket.on('server_error', (msg) => {
          if (msg === 'No available public lobbies found.') {
              CustomAlert.alert(t('noLobbies'), t('noPublicLobbies'));
          }
      });
      return () => {
          socket.off('random_lobby_found');
          socket.off('server_error');
      }
  }, []);

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="px-6 pb-4 border-b border-zinc-800 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-black">{t('joinGame')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">{t('back')}</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-12 items-center">
        <Text className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-4">{t('enterRoomCode')}</Text>
        <TextInput 
            className="bg-zinc-800 text-white text-center text-4xl font-black tracking-widest p-6 rounded-2xl border border-zinc-700 w-full mb-8"
            placeholder="XXXX"
            placeholderTextColor="#52525b"
            maxLength={4}
            autoCapitalize="characters"
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
        />
        <TouchableOpacity 
            className={`w-full py-4 rounded-2xl items-center ${code.length === 4 ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-zinc-800'}`}
            disabled={code.length !== 4}
            onPress={() => router.push({ pathname: '/lobby', params: { code: code } })}
        >
            <Text className={`font-bold text-lg ${code.length === 4 ? 'text-white' : 'text-zinc-500'}`}>{t('joinLobby')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            className="w-full mt-4 py-4 rounded-2xl items-center bg-blue-500/20 border border-blue-500/50"
            onPress={() => {
                if (!socket.connected) socket.connect();
                socket.emit('join_random_lobby', { user: { name: playerName } });
            }}
        >
            <Text className="font-bold text-lg text-blue-400">{t('joinRandomLobby')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
