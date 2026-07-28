import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { socket } from '../utils/socket';

export default function Home() {
  const router = useRouter();
  const { playerName, setPlayerName } = useGameStore();
  const [tempName, setTempName] = useState('');

  useEffect(() => {
      socket.connect();
      socket.on('random_lobby_found', (lobbyCode) => {
          router.push({ pathname: '/lobby', params: { code: lobbyCode, isHost: 'false' } });
      });
      socket.on('server_error', (msg) => {
          if (msg === 'No available public lobbies found.') {
              Alert.alert('No Lobbies', msg);
          }
      });
      return () => {
          socket.off('random_lobby_found');
          socket.off('server_error');
      }
  }, []);

  if (!playerName) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
        <View className="items-center mb-12">
          <Text className="text-5xl font-black text-white tracking-tighter">
            RUN<Text className="text-emerald-500">OPOLY</Text>
          </Text>
          <Text className="text-zinc-400 mt-2 text-lg font-medium">Welcome to the game!</Text>
        </View>
        <View className="w-full max-w-sm space-y-4">
          <Text className="text-zinc-400 font-bold uppercase tracking-widest ml-1 mb-2">Choose a Username</Text>
          <TextInput 
            className="w-full bg-zinc-800 text-white p-5 rounded-2xl border border-zinc-700 font-bold text-lg mb-4"
            placeholder="e.g. Runterya"
            placeholderTextColor="#52525b"
            value={tempName}
            onChangeText={setTempName}
          />
          <TouchableOpacity 
            className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30"
            onPress={() => tempName.trim() && setPlayerName(tempName.trim())}
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-zinc-900 p-6">
      <View className="items-center mb-12">
        <Text className="text-5xl font-black text-white tracking-tighter">
          RUN<Text className="text-emerald-500">OPOLY</Text>
        </Text>
        <Text className="text-zinc-400 mt-2 text-lg font-medium">Welcome back, <Text className="text-emerald-400">{playerName}</Text></Text>
      </View>

      <View className="w-full max-w-sm space-y-4 gap-4">
        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30"
          onPress={() => router.push({ pathname: '/lobby', params: { isHost: 'true' } })}
        >
          <Text className="text-white font-bold text-lg">Create Lobby</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center"
          onPress={() => router.push('/join')}
        >
          <Text className="text-white font-bold text-lg">Join Private Lobby</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-blue-500/20 border border-blue-500/50 py-4 rounded-2xl items-center"
          onPress={() => {
              socket.emit('join_random_lobby', { user: { name: playerName } });
          }}
        >
          <Text className="text-blue-400 font-bold text-lg">Join Random Lobby</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 py-4 rounded-2xl items-center"
          onPress={() => router.push('/editors')}
        >
          <Text className="text-zinc-300 font-bold text-lg">Game Editors</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
