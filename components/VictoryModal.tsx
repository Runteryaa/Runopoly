import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '../utils/i18n';
import { useGameStore, Player } from '../store/gameStore';

interface VictoryModalProps {
    visible: boolean;
    winner: Player | null;
}

export default function VictoryModal({ visible, winner }: VictoryModalProps) {
    const router = useRouter();
    const { t } = useTranslation();
    const { properties } = useGameStore();

    if (!winner) return null;

    const ownedPropsCount = properties.filter(p => p.ownerId === winner.id).length;

    const handleBackHome = () => {
        useGameStore.getState().resetGame();
        router.replace('/');
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-black/85 justify-center items-center p-6 z-50">
                <View className="bg-zinc-900 border-2 border-amber-500/80 rounded-3xl p-8 w-full max-w-sm items-center shadow-2xl shadow-amber-500/20">
                    <View className="w-24 h-24 bg-amber-500/20 rounded-full items-center justify-center mb-4 border border-amber-500/40">
                        <Text className="text-6xl">👑</Text>
                    </View>

                    <Text className="text-amber-400 font-black text-3xl tracking-wider uppercase text-center mb-1">
                        {t('victory')}
                    </Text>
                    <Text className="text-zinc-400 font-bold text-sm mb-4 text-center">
                        {t('congratulations')}
                    </Text>

                    <View className="bg-zinc-800/90 w-full rounded-2xl p-5 border border-zinc-700/80 items-center mb-6">
                        <Text className="text-2xl font-black mb-2" style={{ color: winner.color }}>
                            {winner.character || '👤'} {winner.name}
                        </Text>
                        <Text className="text-emerald-400 font-black text-xl mb-1">
                            ${winner.money}
                        </Text>
                        <Text className="text-zinc-400 font-semibold text-xs">
                            {t('propertiesOwned', { count: ownedPropsCount })}
                        </Text>
                    </View>

                    <TouchableOpacity 
                        onPress={handleBackHome}
                        className="w-full bg-amber-500 py-4 rounded-2xl items-center shadow-lg shadow-amber-500/30"
                    >
                        <Text className="text-zinc-950 font-black text-lg uppercase tracking-wider">
                            {t('backToHome')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
