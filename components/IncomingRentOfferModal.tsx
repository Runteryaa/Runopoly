import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export default function IncomingRentOfferModal({ visible, offer, onClose, lobbyCode }: any) {
    if (!offer) return null;

    const fromPlayer = useGameStore.getState().gamePlayers.find(p => p.id === offer.fromPlayerId);
    const property = useGameStore.getState().properties.find(p => p.id === offer.propertyId);

    const handleAccept = () => {
        socket.emit('respond_custom_rent', { ...offer, lobbyCode, accepted: true, amount: offer.offeredAmount });
        onClose();
    };

    const handleReject = () => {
        socket.emit('respond_custom_rent', { ...offer, lobbyCode, accepted: false, amount: offer.originalAmount });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 bg-zinc-900/90 justify-center items-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 w-full max-w-sm">
                    <Text className="text-white text-2xl font-black mb-2 text-center">Rent Negotiation</Text>
                    <Text className="text-zinc-400 text-center mb-6">
                        <Text className="text-white font-bold">{fromPlayer?.name}</Text> landed on <Text className="text-white font-bold">{property?.name}</Text> and is asking for a discount on the rent.
                    </Text>

                    <View className="flex-row justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-700 mb-4">
                        <View>
                            <Text className="text-zinc-500 font-bold uppercase text-[10px]">Normal Rent</Text>
                            <Text className="text-zinc-400 font-black line-through">${offer.originalAmount}</Text>
                        </View>
                        <Text className="text-zinc-500 font-bold">➡️</Text>
                        <View className="items-end">
                            <Text className="text-emerald-500 font-bold uppercase text-[10px]">Offered Rent</Text>
                            <Text className="text-emerald-400 text-2xl font-black">${offer.offeredAmount}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between gap-2">
                        <TouchableOpacity 
                            onPress={handleReject}
                            className="flex-1 bg-red-500 py-3 rounded-xl items-center shadow-lg shadow-red-500/30"
                        >
                            <Text className="text-white font-bold">Reject</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={handleAccept}
                            className="flex-1 bg-emerald-500 py-3 rounded-xl items-center shadow-lg shadow-emerald-500/30"
                        >
                            <Text className="text-white font-black">Accept</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
