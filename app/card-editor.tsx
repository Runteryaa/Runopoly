import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useGameStore, Card } from '../store/gameStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function CardEditor() {
  const router = useRouter();
  const { cards, addCard } = useGameStore();
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('50');
  const [type, setType] = useState<'chance' | 'community'>('chance');
  const [action, setAction] = useState<'pay' | 'receive' | 'move'>('receive');
  const [behavior, setBehavior] = useState<'instant' | 'keepable'>('instant');

  const handleAddCard = () => {
    if (!text.trim()) return;
    const newCard: Card = {
      id: Math.random().toString(),
      type,
      action,
      text,
      amount: parseInt(amount) || 0,
      behavior
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
            
            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Type</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity onPress={() => setType('chance')} className={`flex-1 py-2 rounded-lg items-center ${type === 'chance' ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Chance</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setType('community')} className={`flex-1 py-2 rounded-lg items-center ${type === 'community' ? 'bg-blue-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Community</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Behavior</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity onPress={() => setBehavior('instant')} className={`flex-1 py-2 rounded-lg items-center ${behavior === 'instant' ? 'bg-red-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Instant</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setBehavior('keepable')} className={`flex-1 py-2 rounded-lg items-center ${behavior === 'keepable' ? 'bg-purple-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Keepable</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Action</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity onPress={() => setAction('receive')} className={`flex-1 py-2 rounded-lg items-center ${action === 'receive' ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Receive</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAction('pay')} className={`flex-1 py-2 rounded-lg items-center ${action === 'pay' ? 'bg-red-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Pay</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAction('move')} className={`flex-1 py-2 rounded-lg items-center ${action === 'move' ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                <Text className="text-white font-bold">Move</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Card Text</Text>
            <TextInput 
              className="bg-zinc-900 text-white p-4 rounded-xl mb-4 border border-zinc-700 font-medium text-base"
              value={text}
              onChangeText={setText}
              placeholder="e.g. Bank error in your favor"
              placeholderTextColor="#52525b"
            />
            <Text className="text-zinc-400 mb-1.5 text-xs font-bold uppercase tracking-wider">Amount / Tile Index</Text>
            <TextInput 
              className="bg-zinc-900 text-white p-4 rounded-xl mb-6 border border-zinc-700 font-bold text-base"
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
                <Text className="text-zinc-400 font-bold">{card.action}: {card.amount}</Text>
            </View>
            <View className="items-end gap-1">
              <View className={`px-3 py-1 rounded-full ${card.type === 'chance' ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}>
                  <Text className={`font-bold text-xs uppercase tracking-wider ${card.type === 'chance' ? 'text-orange-500' : 'text-blue-500'}`}>{card.type}</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${card.behavior === 'instant' ? 'bg-red-500/20' : 'bg-purple-500/20'}`}>
                  <Text className={`font-bold text-xs uppercase tracking-wider ${card.behavior === 'instant' ? 'text-red-500' : 'text-purple-500'}`}>{card.behavior}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
