import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';
import { useTranslation } from '../utils/i18n';

export default function AuctionModal({ visible, auctionData, onClose, lobbyCode, myPlayerId }: any) {
    const [bidAmount, setBidAmount] = useState('');
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const { t } = useTranslation();

    useEffect(() => {
        socket.on('auction_timer_tick', (t) => setTimeLeft(t));
        return () => {
            socket.off('auction_timer_tick');
        }
    }, []);

    if (!auctionData) return null;

    const property = useGameStore.getState().properties.find(p => p.id === auctionData.propertyId);
    const highestBidder = useGameStore.getState().gamePlayers.find(p => p.id === auctionData.highestBidderId);
    const excludedPlayer = useGameStore.getState().gamePlayers.find(p => p.id === auctionData.excludedPlayerId);
    const myPlayer = useGameStore.getState().gamePlayers.find(p => p.id === myPlayerId);

    const isExcluded = myPlayerId === auctionData.excludedPlayerId;
    const isHost = myPlayer?.isHost;

    const handleBid = () => {
        const amount = parseInt(bidAmount) || 0;
        if (amount <= auctionData.currentBid) {
            alert(t('bidMustBeHigher'));
            return;
        }
        if (myPlayer && myPlayer.money < amount) {
            alert(t('notEnoughMoneyBid'));
            return;
        }
        socket.emit('place_bid', { lobbyCode, propertyId: property?.id, bidderId: myPlayerId, bid: amount });
        setBidAmount('');
    };

    const handleEndAuction = () => {
        if (!auctionData.highestBidderId) {
            alert(t('noOneBid'));
            socket.emit('end_auction', { lobbyCode, propertyId: property?.id, winnerId: null, winningBid: 0 });
        } else {
            socket.emit('end_auction', { lobbyCode, propertyId: property?.id, winnerId: auctionData.highestBidderId, winningBid: auctionData.currentBid });
        }
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View className="flex-1 bg-zinc-900/90 justify-center items-center p-4">
                <View className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700 w-full max-w-sm">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-white text-2xl font-black">{t('auction')}</Text>
                        {isHost && (
                            <TouchableOpacity onPress={handleEndAuction} className="bg-red-500 px-3 py-1 rounded-full">
                                <Text className="text-white font-bold text-xs uppercase">{t('endAuctionBtn')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <Text className="text-zinc-400 text-center mb-2">
                        {t('isUpForAuction', { name: property?.name || '' })}
                        {t('refusedBy', { name: excludedPlayer?.name || '' })}
                    </Text>

                    {timeLeft !== null && (
                        <View className="bg-red-500/20 py-1 px-4 rounded-full self-center mb-4 border border-red-500/30">
                            <Text className="text-red-400 font-black text-xs">{t('timeLeftStr', { time: timeLeft })}</Text>
                        </View>
                    )}

                    <View className="bg-zinc-900 rounded-xl p-6 border border-zinc-700 mb-6 items-center">
                        <Text className="text-zinc-500 font-bold uppercase text-xs mb-1">{t('currentHighestBid')}</Text>
                        <Text className="text-emerald-400 text-4xl font-black">${auctionData.currentBid}</Text>
                        <Text className="text-zinc-400 font-bold mt-2">
                            {highestBidder ? t('byName', { name: highestBidder.name }) : t('noOneYet')}
                        </Text>
                    </View>

                    {isExcluded ? (
                        <Text className="text-red-400 font-bold text-center italic">{t('cannotParticipate')}</Text>
                    ) : (
                        <View>
                            <TextInput 
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-700 mb-4 font-bold text-lg"
                                keyboardType="numeric"
                                value={bidAmount}
                                onChangeText={setBidAmount}
                                placeholder={t('minBid', { amount: auctionData.currentBid + 1 })}
                                placeholderTextColor="#71717a"
                            />

                            <TouchableOpacity 
                                onPress={handleBid}
                                className="bg-emerald-500 py-3 rounded-xl items-center shadow-lg shadow-emerald-500/30"
                            >
                                <Text className="text-white font-black text-lg">{t('placeBidBtn')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
