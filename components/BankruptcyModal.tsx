import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { CustomAlert } from '../utils/alert';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../utils/i18n';

export default function BankruptcyModal({ visible, myPlayerId, lobbyCode, onMortgage }: any) {
    if (!visible) return null;

    const myPlayer = useGameStore.getState().gamePlayers.find(p => p.id === myPlayerId);
    const { t } = useTranslation();
    if (!myPlayer) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-black/80 justify-center items-center p-4">
                <View className="bg-zinc-900 border-2 border-red-900 rounded-3xl p-6 w-full max-w-md items-center">
                    
                    <View className="bg-red-950/50 p-4 rounded-full mb-4 border border-red-900">
                        <Text className="text-red-500 text-4xl">🚨</Text>
                    </View>

                    <Text className="text-red-500 text-3xl font-black mb-2 text-center">{t('bankrupt')}</Text>
                    <Text className="text-zinc-300 text-center text-lg mb-2">
                        {t('inDebtDesc')}<Text className="text-red-400 font-bold">${myPlayer.money}</Text>.
                    </Text>
                    <Text className="text-zinc-500 text-center mb-6">
                        {t('raiseFundsDesc')}
                    </Text>

                    <View className="w-full gap-3">
                        <TouchableOpacity 
                            className="bg-orange-600 p-4 rounded-xl items-center border border-orange-500 shadow-lg shadow-orange-600/20"
                            onPress={onMortgage}
                        >
                            <Text className="text-white font-black text-lg">{t('mortgagePropertiesBtn')}</Text>
                            <Text className="text-orange-200 text-xs mt-1">{t('mortgagePropertiesDesc')}</Text>
                        </TouchableOpacity>



                        <View className="h-px bg-zinc-800 my-2" />

                        <TouchableOpacity 
                            className="bg-zinc-800 p-4 rounded-xl items-center border border-red-900/50"
                            onPress={() => {
                                CustomAlert.alert(
                                    t('declareBankruptcyConfirm'), 
                                    t('declareBankruptcyConfirmDesc'), 
                                    [
                                        { text: t('cancel'), style: 'cancel' },
                                        { text: t('iAmBankruptBtn'), style: 'destructive', onPress: () => {
                                            socket.emit('declare_bankruptcy', { lobbyCode, playerId: myPlayer!.id });
                                            socket.emit('end_turn', { lobbyCode });
                                            socket.emit('kick_player', { lobbyCode, playerId: myPlayer!.id });
                                        }}
                                    ]
                                );
                            }}
                        >
                            <Text className="text-red-500 font-bold">{t('declareBankruptcyBtn')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
