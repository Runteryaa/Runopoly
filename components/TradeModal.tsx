import { CustomAlert } from '../utils/alert';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useGameStore, TradeData } from '../store/gameStore';
import { socket } from '../utils/socket';
import { useTranslation, getTranslatedTileName } from '../utils/i18n';

interface TradeModalProps {
    visible: boolean;
    onClose: () => void;
    initialTradeTarget?: { ownerId: string; propertyId: string } | null;
}

export default function TradeModal({ visible, onClose, initialTradeTarget }: TradeModalProps) {
    const { gamePlayers, playerName, properties, lobbyCode } = useGameStore();
    const { t } = useTranslation();
    const myPlayer = gamePlayers.find(p => p.name === playerName);

    const [selectedTargetId, setSelectedTargetId] = useState<string>('');
    const [offerMoney, setOfferMoney] = useState('0');
    const [requestMoney, setRequestMoney] = useState('0');
    const [offerProps, setOfferProps] = useState<string[]>([]);
    const [requestProps, setRequestProps] = useState<string[]>([]);

    React.useEffect(() => {
        if (visible && initialTradeTarget) {
            setSelectedTargetId(initialTradeTarget.ownerId);
            setRequestProps([initialTradeTarget.propertyId]);
        }
    }, [visible, initialTradeTarget]);

    if (!myPlayer) return null;

    const otherPlayers = gamePlayers.filter(p => p.id !== myPlayer.id);
    const targetPlayer = gamePlayers.find(p => p.id === selectedTargetId);

    const myProperties = properties.filter(p => p.ownerId === myPlayer.id);
    const theirProperties = targetPlayer ? properties.filter(p => p.ownerId === targetPlayer.id) : [];

    const toggleProp = (id: string, isOffer: boolean) => {
        if (isOffer) {
            setOfferProps(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
        } else {
            setRequestProps(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
        }
    };

    const handleProposeTrade = () => {
        if (!targetPlayer) return;
        const oMoney = parseInt(offerMoney) || 0;
        const rMoney = parseInt(requestMoney) || 0;

        if (oMoney > myPlayer.money) {
            CustomAlert.alert(t('error'), t('notEnoughMoney'));
            return;
        }

        const tradeData: TradeData = {
            id: Math.random().toString(),
            fromId: myPlayer.id,
            toId: targetPlayer.id,
            offerMoney: oMoney,
            requestMoney: rMoney,
            offerProperties: offerProps,
            requestProperties: requestProps
        };

        socket.emit('propose_trade', { lobbyCode, trade: tradeData });
        CustomAlert.alert(t('sent'), t('tradeProposalSent'));
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-zinc-900/90 justify-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 max-h-[85%]">
                    <Text className="text-white text-2xl font-black mb-4">{t('proposeTrade')}</Text>

                    <Text className="text-zinc-400 font-bold mb-2">{t('selectPlayerTrade')}</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        {otherPlayers.map(p => (
                            <TouchableOpacity 
                                key={p.id} 
                                onPress={() => { setSelectedTargetId(p.id); setRequestProps([]); }}
                                className={`mr-2 px-4 py-2 rounded-xl border ${selectedTargetId === p.id ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-700 border-zinc-600'}`}
                            >
                                <Text className="text-white font-bold">{p.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {targetPlayer && (
                        <ScrollView className="space-y-4">
                            <Text className="text-emerald-400 font-bold mb-2">{t('youOffer')}</Text>
                            <TextInput 
                                className="bg-zinc-900 text-white p-3 rounded-xl mb-2 font-bold"
                                placeholder={t('moneyToOffer')}
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
                                    <Text className="text-white font-bold">{getTranslatedTileName(prop.name)}</Text>
                                </TouchableOpacity>
                            ))}

                            <Text className="text-rose-400 font-bold mt-4 mb-2">{t('youRequestFrom', { name: targetPlayer.name })}</Text>
                            <TextInput 
                                className="bg-zinc-900 text-white p-3 rounded-xl mb-2 font-bold"
                                placeholder={t('moneyToRequest')}
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
                                    <Text className="text-white font-bold">{getTranslatedTileName(prop.name)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}


                    <View className="flex-row gap-3 mt-6">
                        <TouchableOpacity onPress={onClose} className="flex-1 bg-zinc-700 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleProposeTrade} className="flex-1 bg-emerald-500 p-4 rounded-xl items-center">
                            <Text className="text-white font-bold">{t('propose')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
