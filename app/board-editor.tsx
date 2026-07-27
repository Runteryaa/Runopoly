import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { useRouter } from 'expo-router';

export default function BoardEditor() {
  const router = useRouter();
  const { properties, setProperty } = useGameStore();

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-zinc-800">
        <Text className="text-white text-2xl font-black tracking-tight">Board Editor</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-emerald-500/20 px-4 py-2 rounded-lg">
          <Text className="text-emerald-500 font-bold">Save & Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {properties.slice(0, 40).map((prop, index) => (
          <View key={prop.id} className="bg-zinc-800 p-4 rounded-2xl mb-4 border border-zinc-700/50 shadow-sm">
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: prop.color }} />
                    <Text className="text-white font-bold text-lg">Tile {index}</Text>
                </View>
                <Text className="text-zinc-500 font-mono text-xs">{prop.id}</Text>
            </View>
            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Property Name</Text>
            <TextInput 
              className="bg-zinc-900 text-white p-4 rounded-xl mb-4 border border-zinc-700 font-medium text-base"
              value={prop.name}
              onChangeText={(t) => setProperty(prop.id, { name: t })}
              placeholderTextColor="#52525b"
            />
            <View className="flex-row gap-4">
                <View className="flex-1">
                    <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Buy Price</Text>
                    <TextInput 
                      className="bg-zinc-900 text-emerald-400 p-4 rounded-xl border border-zinc-700 font-bold text-base"
                      value={prop.price.toString()}
                      keyboardType="numeric"
                      onChangeText={(t) => setProperty(prop.id, { price: parseInt(t) || 0 })}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Rent Price</Text>
                    <TextInput 
                      className="bg-zinc-900 text-rose-400 p-4 rounded-xl border border-zinc-700 font-bold text-base"
                      value={prop.rent.toString()}
                      keyboardType="numeric"
                      onChangeText={(t) => setProperty(prop.id, { rent: parseInt(t) || 0 })}
                    />
                </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
