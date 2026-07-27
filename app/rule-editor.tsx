import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { useState } from 'react';

export default function RuleEditor() {
  const router = useRouter();
  const { rules, setRules } = useGameStore();
  
  const [goSalary, setGoSalary] = useState(rules.goSalary.toString());
  const [jailFine, setJailFine] = useState(rules.jailFine.toString());
  const [startingMoney, setStartingMoney] = useState(rules.startingMoney.toString());
  const [maxDebt, setMaxDebt] = useState((rules.maxDebt || 500).toString());

  const handleSave = () => {
    setRules({
        goSalary: parseInt(goSalary) || 200,
        jailFine: parseInt(jailFine) || 50,
        startingMoney: parseInt(startingMoney) || 1500,
        maxDebt: parseInt(maxDebt) || 500
    });
    Alert.alert('Saved', 'Game rules updated successfully!');
    router.back();
  };

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="px-6 pb-4 border-b border-zinc-800 flex-row justify-between items-center">
        <Text className="text-white text-2xl font-black">Rule Editor</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-zinc-800 px-4 py-2 rounded-lg">
          <Text className="text-zinc-400 font-bold">Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-6">
        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Starting Money ($)</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={startingMoney}
                onChangeText={setStartingMoney}
            />
            <Text className="text-zinc-500 text-xs mt-2">Amount of money each player starts with.</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Passing GO Salary ($)</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={goSalary}
                onChangeText={setGoSalary}
            />
            <Text className="text-zinc-500 text-xs mt-2">Money awarded for completing a full lap.</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Jail Fine ($)</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={jailFine}
                onChangeText={setJailFine}
            />
            <Text className="text-zinc-500 text-xs mt-2">Cost to bribe guards and get out of jail.</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Maximum Debt ($)</Text>
            <TextInput
                className="w-full bg-zinc-800 text-white p-4 rounded-xl border border-zinc-700 font-bold text-lg"
                keyboardType="numeric"
                value={maxDebt}
                onChangeText={setMaxDebt}
            />
            <Text className="text-zinc-500 text-xs mt-2">Maximum allowed negative balance before bankruptcy.</Text>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Theme</Text>
            <View className="flex-row gap-2 flex-wrap mt-2">
                {['Classic', 'Istanbul', 'Köln', 'America'].map(t => (
                    <TouchableOpacity 
                        key={t}
                        onPress={() => setRules({ theme: t })}
                        className={`px-4 py-2 rounded-lg border ${rules.theme === t ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'}`}
                    >
                        <Text className={`font-bold ${rules.theme === t ? 'text-white' : 'text-zinc-400'}`}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View className="mb-6">
            <Text className="text-zinc-400 font-bold uppercase tracking-widest mb-2">Board Size</Text>
            <View className="flex-row gap-2 flex-wrap mt-2">
                {[24, 32, 40].map(s => (
                    <TouchableOpacity 
                        key={s}
                        onPress={() => setRules({ boardSize: s })}
                        className={`px-4 py-2 rounded-lg border ${rules.boardSize === s ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'}`}
                    >
                        <Text className={`font-bold ${rules.boardSize === s ? 'text-white' : 'text-zinc-400'}`}>{s === 24 ? 'Small (24)' : s === 32 ? 'Medium (32)' : 'Classic (40)'}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <Text className="text-zinc-500 text-xs mt-2">Changes the number of tiles on the board.</Text>
        </View>

        <TouchableOpacity 
          className="w-full bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/30 mt-4 mb-10"
          onPress={handleSave}
        >
            <Text className="text-white font-bold text-lg">Save Rules</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
