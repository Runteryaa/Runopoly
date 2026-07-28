import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export default function RentPaymentModal({ visible, onClose, property, ownerId, fullRentAmount, myPlayerId, lobbyCode }: any) {
    const [customAmount, setCustomAmount] = useState(fullRentAmount?.toString() || '0');

    useEffect(() => {
        if (visible) {
            setCustomAmount(fullRentAmount?.toString() || '0');
        }
    }, [visible, fullRentAmount]);

    if (!property) return null;
    const owner = useGameStore.getState().gamePlayers.find(p => p.id === ownerId);

    const handlePayFull = () => {
        socket.emit('pay_rent', { lobbyCode, fromPlayerId: myPlayerId, toPlayerId: ownerId, amount: fullRentAmount });
        onClose();
    };

    const handleProposeCustom = () => {
        const amount = parseInt(customAmount) || 0;
        if (amount < 0) return;
        socket.emit('propose_custom_rent', { 
            lobbyCode, 
            fromPlayerId: myPlayerId, 
            toPlayerId: ownerId, 
            propertyId: property.id, 
            offeredAmount: amount, 
            originalAmount: fullRentAmount 
        });
        alert('Offer sent to the property owner!');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-zinc-900/90 justify-center items-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 w-full max-w-sm">
                    <Text className="text-white text-2xl font-black mb-2 text-center">Rent Due!</Text>
                    <Text className="text-zinc-400 text-center mb-6">
                        You landed on <Text className="text-white font-bold">{property.name}</Text>. 
                        It is owned by <Text className="text-white font-bold">{owner?.name}</Text>.
                    </Text>

                    <View className="bg-zinc-900 rounded-xl p-4 border border-zinc-700 mb-6">
                        <Text className="text-zinc-500 font-bold uppercase text-xs mb-1">Standard Rent</Text>
                        <Text className="text-red-400 text-3xl font-black">${fullRentAmount}</Text>
                    </View>

                    <Text className="text-zinc-400 font-bold mb-2">Want to negotiate?</Text>
                    <TextInput 
                        className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-700 mb-4 font-bold text-lg"
                        keyboardType="numeric"
                        value={customAmount}
                        onChangeText={setCustomAmount}
                        placeholder="Enter custom amount"
                        placeholderTextColor="#71717a"
                    />

                    <View className="flex-row justify-between gap-2">
                        <TouchableOpacity 
                            onPress={handleProposeCustom}
                            className="flex-1 bg-zinc-700 py-3 rounded-xl items-center border border-zinc-600"
                        >
                            <Text className="text-white font-bold">Ask Discount</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handlePayFull}
                            className="flex-1 bg-red-500 py-3 rounded-xl items-center shadow-lg shadow-red-500/30"
                        >
                            <Text className="text-white font-black">Pay Full</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
