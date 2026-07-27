import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function EditorsMenu() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-zinc-900 pt-16 px-6">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-white text-3xl font-black">Editors</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">Back</Text>
        </TouchableOpacity>
      </View>

      <View className="w-full space-y-4 gap-4">
        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 p-6 rounded-2xl flex-row items-center justify-between"
          onPress={() => router.push('/board-editor')}
        >
          <View>
              <Text className="text-white font-bold text-xl mb-1">Board Editor</Text>
              <Text className="text-zinc-500 text-sm">Customize property names and prices</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 p-6 rounded-2xl flex-row items-center justify-between"
          onPress={() => router.push('/card-editor')}
        >
          <View>
              <Text className="text-white font-bold text-xl mb-1">Card Editor</Text>
              <Text className="text-zinc-500 text-sm">Create Chance and Community Chest cards</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-full bg-zinc-800 border border-zinc-700 p-6 rounded-2xl flex-row items-center justify-between"
          onPress={() => router.push('/rule-editor')}
        >
          <View>
              <Text className="text-white font-bold text-xl mb-1">Rule Editor</Text>
              <Text className="text-zinc-500 text-sm">Change starting money, fines, and salaries</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
