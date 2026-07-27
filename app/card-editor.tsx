import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore, Card } from '../store/gameStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function CardEditor() {
  const router = useRouter();
  const { cards, addCard } = useGameStore();
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('50');

  const handleAddCard = () => {
    if (!text.trim()) return;
    const newCard: Card = {
      id: Math.random().toString(),
      type: 'chance',
      action: 'receive',
      text,
      amount: parseInt(amount) || 0
    };
    addCard(newCard);
    setText('');
  };

  return (
    <View className="flex-1 bg-zinc-900 pt-16">
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-zinc-800">
        <Text className="text-white text-2xl font-black tracking-tight">Card Editor</Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-emerald-500/20 px-4 py-2 rounded-lg">
          <Text className="text-emerald-500 font-bold">Save & Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
        
        <View className="bg-zinc-800 p-5 rounded-2xl mb-8 border border-zinc-700/50 shadow-sm">
            <Text className="text-white font-black text-xl mb-6">Create New Card</Text>
            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Card Text</Text>
            <TextInput 
              className="bg-zinc-900 text-white p-4 rounded-xl mb-4 border border-zinc-700 font-medium text-base"
              value={text}
              onChangeText={setText}
              placeholder="e.g. Bank error in your favor"
              placeholderTextColor="#52525b"
            />
            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Amount (Receive)</Text>
            <TextInput 
              className="bg-zinc-900 text-emerald-400 p-4 rounded-xl mb-6 border border-zinc-700 font-bold text-base"
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
            />
            <TouchableOpacity onPress={handleAddCard} className="bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/20">
                <Text className="text-white font-bold text-base">Add Card</Text>
            </TouchableOpacity>
        </View>

        <Text className="text-zinc-500 font-bold mb-4 ml-2 uppercase tracking-widest">Existing Cards ({cards.length})</Text>
        {cards.map((card) => (
          <View key={card.id} className="bg-zinc-800 p-4 rounded-2xl mb-4 border border-zinc-700/30 flex-row items-center justify-between">
            <View className="flex-1 pr-4">
                <Text className="text-white font-bold text-base mb-1">{card.text}</Text>
                <Text className="text-emerald-400 font-bold">+{card.amount}</Text>
            </View>
            <View className="bg-orange-500/20 px-3 py-1 rounded-full">
                <Text className="text-orange-500 font-bold text-xs uppercase tracking-wider">{card.type}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
