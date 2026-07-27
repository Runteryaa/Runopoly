import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function JoinGame() {
  const router = useRouter();
  const [code, setCode] = useState('');

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="px-6 pb-4 border-b border-zinc-800 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-black">Join Game</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6 pt-12 items-center">
        <Text className="text-zinc-400 text-sm font-bold uppercase tracking-widest mb-4">Enter Room Code</Text>
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
            <Text className={`font-bold text-lg ${code.length === 4 ? 'text-white' : 'text-zinc-500'}`}>Join Lobby</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
