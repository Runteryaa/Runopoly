import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useGameStore } from '../store/gameStore';

interface InventoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function InventoryModal({ visible, onClose }: InventoryModalProps) {
    const { gamePlayers, playerName, properties } = useGameStore();
    const myPlayer = gamePlayers.find(p => p.name === playerName);
    
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');

    useEffect(() => {
        if (visible && myPlayer) {
            setSelectedPlayerId(myPlayer.id);
        }
    }, [visible]);

    if (!myPlayer) return null;

    const viewedPlayer = gamePlayers.find(p => p.id === selectedPlayerId) || myPlayer;
    const viewedProperties = properties.filter(p => p.ownerId === viewedPlayer.id);

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 max-h-[80%] w-full flex-shrink">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-2xl font-black">Inventories</Text>
                        <TouchableOpacity onPress={onClose} className="bg-zinc-700 w-8 h-8 rounded-full items-center justify-center">
                            <Text className="text-white font-bold">X</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-[45px] min-h-[45px]">
                        {gamePlayers.map(p => (
                            <TouchableOpacity
                                key={p.id}
                                onPress={() => setSelectedPlayerId(p.id)}
                                className={`mr-2 px-4 h-[40px] justify-center rounded-xl border ${selectedPlayerId === p.id ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-700 border-zinc-600'}`}
                            >
                                <Text className="text-white font-bold">{p.id === myPlayer.id ? 'Me' : p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View className="bg-zinc-900 p-4 rounded-xl mb-4 border border-zinc-700 flex-row justify-between items-center">
                        <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Total Balance</Text>
                        <Text className="text-emerald-400 text-2xl font-black">${viewedPlayer.money}</Text>
                    </View>

                    <Text className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-3">{viewedPlayer.name}'s Properties ({viewedProperties.length})</Text>
                    <ScrollView className="w-full mt-2">
                        {viewedProperties.length === 0 ? (
                            <Text className="text-zinc-500 italic text-center py-4">No properties owned yet.</Text>
                        ) : (
                            viewedProperties.map(prop => (
                                <View key={prop.id} className="bg-zinc-900 p-4 rounded-xl mb-3 border border-zinc-700 flex-row justify-between items-center">
                                    <View className="flex-row items-center gap-3">
                                        <View style={{ backgroundColor: prop.color }} className="w-4 h-4 rounded-full border border-zinc-600" />
                                        <Text className="text-white font-bold text-lg">{prop.name}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-zinc-500 font-bold text-[10px] uppercase">Rent Yield</Text>
                                        <Text className="text-emerald-400 font-black">${prop.rent}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
