import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { CustomAlert } from '../utils/alert';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export default function BankruptcyModal({ visible, myPlayerId, lobbyCode, onMortgage, onBorrow, isAwaitingLoan }: any) {
    if (!visible) return null;

    const myPlayer = useGameStore.getState().gamePlayers.find(p => p.id === myPlayerId);
    if (!myPlayer) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-black/80 justify-center items-center p-4">
                <View className="bg-zinc-900 border-2 border-red-900 rounded-3xl p-6 w-full max-w-md items-center">
                    
                    <View className="bg-red-950/50 p-4 rounded-full mb-4 border border-red-900">
                        <Text className="text-red-500 text-4xl">🚨</Text>
                    </View>

                    <Text className="text-red-500 text-3xl font-black mb-2 text-center">BANKRUPT!</Text>
                    <Text className="text-zinc-300 text-center text-lg mb-2">
                        You are in debt! Your balance is <Text className="text-red-400 font-bold">${myPlayer.money}</Text>.
                    </Text>
                    <Text className="text-zinc-500 text-center mb-6">
                        You must raise funds to continue playing, or declare bankruptcy and leave the game.
                    </Text>

                    <View className="w-full gap-3">
                        <TouchableOpacity 
                            className="bg-orange-600 p-4 rounded-xl items-center border border-orange-500 shadow-lg shadow-orange-600/20"
                            onPress={onMortgage}
                        >
                            <Text className="text-white font-black text-lg">MORTGAGE PROPERTIES</Text>
                            <Text className="text-orange-200 text-xs mt-1">Sell houses or mortgage properties</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="bg-blue-600 p-4 rounded-xl items-center border border-blue-500 shadow-lg shadow-blue-600/20"
                            onPress={() => {
                                if (isAwaitingLoan) {
                                    CustomAlert.alert('Pending', 'You already requested a loan. Waiting for responses...');
                                } else {
                                    onBorrow();
                                }
                            }}
                        >
                            <Text className="text-white font-black text-lg">REQUEST LOAN</Text>
                            <Text className="text-blue-200 text-xs mt-1">Borrow money from other players</Text>
                        </TouchableOpacity>

                        <View className="h-px bg-zinc-800 my-2" />

                        <TouchableOpacity 
                            className="bg-zinc-800 p-4 rounded-xl items-center border border-red-900/50"
                            onPress={() => {
                                CustomAlert.alert(
                                    'Declare Bankruptcy?', 
                                    'Are you sure you want to declare bankruptcy? You will be eliminated and lose all your properties.', 
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'I am Bankrupt', style: 'destructive', onPress: () => {
                                            socket.emit('declare_bankruptcy', { lobbyCode, playerId: myPlayer!.id });
                                            socket.emit('end_turn', { lobbyCode });
                                            socket.emit('kick_player', { lobbyCode, playerId: myPlayer!.id });
                                        }}
                                    ]
                                );
                            }}
                        >
                            <Text className="text-red-500 font-bold">DECLARE BANKRUPTCY</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
