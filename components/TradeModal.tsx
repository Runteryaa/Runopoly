import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';

interface TradeModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function TradeModal({ visible, onClose }: TradeModalProps) {
    const { gamePlayers, playerName, properties, lobbyCode } = useGameStore();
    const myPlayer = gamePlayers.find(p => p.name === playerName);
    
    const [targetId, setTargetId] = useState('');
    const [offerMoney, setOfferMoney] = useState('');
    const [requestMoney, setRequestMoney] = useState('');
    const [offerProps, setOfferProps] = useState<string[]>([]);
    const [requestProps, setRequestProps] = useState<string[]>([]);

    if (!myPlayer) return null;

    const targetPlayer = gamePlayers.find(p => p.id === targetId);
    
    const myProperties = properties.filter(p => p.ownerId === myPlayer.id);
    const theirProperties = targetPlayer ? properties.filter(p => p.ownerId === targetPlayer.id) : [];

    const handlePropose = () => {
        if (!targetId) {
            Alert.alert('Error', 'Select a player to trade with.');
            return;
        }
        const trade: TradeData = {
            id: Math.random().toString(),
            fromId: myPlayer.id,
            toId: targetId,
            offerMoney: parseInt(offerMoney) || 0,
            requestMoney: parseInt(requestMoney) || 0,
            offerProperties: offerProps,
            requestProperties: requestProps
        };
        
        socket.emit('propose_trade', { lobbyCode, trade });
        Alert.alert('Sent', 'Trade proposal sent!');
        onClose();
    };

    const toggleProp = (id: string, isOffer: boolean) => {
        if (isOffer) {
            setOfferProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        } else {
            setRequestProps(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 max-h-[80%] flex-shrink w-full">
                    <Text className="text-white text-2xl font-black mb-4">Propose Trade</Text>
                    
                    <Text className="text-zinc-400 font-bold mb-2">Trade With:</Text>
                    <ScrollView horizontal className="mb-4 max-h-[45px]">
                        {gamePlayers.filter(p => p.id !== myPlayer.id).map(p => (
                            <TouchableOpacity 
                                key={p.id}
                                onPress={() => { setTargetId(p.id); setRequestProps([]); setRequestMoney(''); }}
                                className={`mr-2 px-4 py-2 h-[40px] justify-center rounded-xl border ${targetId === p.id ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-700 border-zinc-600'}`}
                            >
                                <Text className="text-white font-bold">{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {targetPlayer && (
                        <ScrollView className="w-full mt-2">
                            <Text className="text-emerald-400 font-bold mb-2">You Offer:</Text>
                            <TextInput 
                                className="bg-zinc-900 text-white p-3 rounded-xl mb-2"
                                placeholder="Money to offer ($)"
                                placeholderTextColor="#71717a"
                                keyboardType="numeric"
                                value={offerMoney}
                                onChangeText={setOfferMoney}
                            />
                            {myProperties.map(prop => (
                                <TouchableOpacity 
                                    key={prop.id}
                                    onPress={() => toggleProp(prop.id, true)}
                                    className={`p-3 rounded-xl mb-2 border ${offerProps.includes(prop.id) ? 'bg-emerald-500/20 border-emerald-500' : 'bg-zinc-900 border-zinc-700'}`}
                                >
                                    <Text className="text-white font-bold">{prop.name}</Text>
                                </TouchableOpacity>
                            ))}

                            <Text className="text-rose-400 font-bold mt-4 mb-2">You Request from {targetPlayer.name}:</Text>
                            <TextInput 
                                className="bg-zinc-900 text-white p-3 rounded-xl mb-2"
                                placeholder="Money to request ($)"
                                placeholderTextColor="#71717a"
                                keyboardType="numeric"
                                value={requestMoney}
                                onChangeText={setRequestMoney}
                            />
                            {theirProperties.map(prop => (
                                <TouchableOpacity 
                                    key={prop.id}
                                    onPress={() => toggleProp(prop.id, false)}
                                    className={`p-3 rounded-xl mb-2 border ${requestProps.includes(prop.id) ? 'bg-rose-500/20 border-rose-500' : 'bg-zinc-900 border-zinc-700'}`}
                                >
                                    <Text className="text-white font-bold">{prop.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}

                    <View className="flex-row gap-3 mt-6">
                        <TouchableOpacity onPress={onClose} className="flex-1 bg-zinc-700 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handlePropose} className="flex-1 bg-emerald-500 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">Propose</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
