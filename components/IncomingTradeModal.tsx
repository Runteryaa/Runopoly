import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useTranslation, getTranslatedTileName } from '../utils/i18n';

interface IncomingTradeModalProps {
    trade: TradeData | null;
    onClose: () => void;
}

export default function IncomingTradeModal({ trade, onClose }: IncomingTradeModalProps) {
    const { gamePlayers, properties, lobbyCode } = useGameStore();
    const { t } = useTranslation();

    if (!trade) return null;

    const fromPlayer = gamePlayers.find(p => p.id === trade.fromId);
    
    const getPropNames = (ids: string[]) => {
        return ids.map(id => getTranslatedTileName(properties.find(p => p.id === id)?.name)).join(', ');
    };


    const handleAccept = () => {
        socket.emit('respond_trade', { lobbyCode, trade, accepted: true });
        onClose();
    };

    const handleReject = () => {
        socket.emit('respond_trade', { lobbyCode, trade, accepted: false });
        onClose();
    };

    return (
        <Modal visible={!!trade} animationType="fade" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700">
                    <Text className="text-white text-2xl font-black mb-4">{t('tradeProposal')}</Text>
                    <Text className="text-zinc-300 mb-6 text-lg">
                        {t('wantsToTradeWithYou', { name: fromPlayer?.name || '' })}
                    </Text>

                    <View className="bg-zinc-900 p-4 rounded-xl mb-4 border border-zinc-700">
                        <Text className="text-emerald-400 font-bold mb-1">{t('theyOffer')}</Text>
                        <Text className="text-white font-black text-lg">${trade.offerMoney}</Text>
                        {trade.offerProperties.length > 0 && <Text className="text-emerald-300 font-bold mt-2">{getPropNames(trade.offerProperties)}</Text>}
                    </View>

                    <View className="bg-zinc-900 p-4 rounded-xl mb-6 border border-zinc-700">
                        <Text className="text-rose-400 font-bold mb-1">{t('theyRequest')}</Text>
                        <Text className="text-white font-black text-lg">${trade.requestMoney}</Text>
                        {trade.requestProperties.length > 0 && <Text className="text-rose-300 font-bold mt-2">{getPropNames(trade.requestProperties)}</Text>}
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={handleReject} className="flex-1 bg-rose-500 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">{t('reject')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAccept} className="flex-1 bg-emerald-500 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">{t('accept')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

