import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { socket } from '../utils/socket';
import { useGameStore } from '../store/gameStore';

export default function AuctionModal({ visible, auctionData, onClose, lobbyCode, myPlayerId }: any) {
    const [bidAmount, setBidAmount] = useState('');

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
            alert('Bid must be higher than current bid!');
            return;
        }
        if (myPlayer && myPlayer.money < amount) {
            alert('You do not have enough money!');
            return;
        }
        socket.emit('place_bid', { lobbyCode, propertyId: property?.id, bidderId: myPlayerId, bid: amount });
        setBidAmount('');
    };

    const handleEndAuction = () => {
        if (!auctionData.highestBidderId) {
            alert('No one bid on this property.');
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
                        <Text className="text-white text-2xl font-black">Auction!</Text>
                        {isHost && (
                            <TouchableOpacity onPress={handleEndAuction} className="bg-red-500 px-3 py-1 rounded-full">
                                <Text className="text-white font-bold text-xs uppercase">End Auction</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    
                    <Text className="text-zinc-400 text-center mb-2">
                        <Text className="text-white font-bold">{property?.name}</Text> is up for auction!
                        (Refused by {excludedPlayer?.name})
                    </Text>

                    <View className="bg-zinc-900 rounded-xl p-6 border border-zinc-700 mb-6 items-center">
                        <Text className="text-zinc-500 font-bold uppercase text-xs mb-1">Current Highest Bid</Text>
                        <Text className="text-emerald-400 text-4xl font-black">${auctionData.currentBid}</Text>
                        <Text className="text-zinc-400 font-bold mt-2">
                            By {highestBidder ? highestBidder.name : 'No one yet'}
                        </Text>
                    </View>

                    {isExcluded ? (
                        <Text className="text-red-400 font-bold text-center italic">You cannot participate in this auction.</Text>
                    ) : (
                        <View>
                            <TextInput 
                                className="bg-zinc-900 text-white p-4 rounded-xl border border-zinc-700 mb-4 font-bold text-lg"
                                keyboardType="numeric"
                                value={bidAmount}
                                onChangeText={setBidAmount}
                                placeholder={`Min bid: $${auctionData.currentBid + 1}`}
                                placeholderTextColor="#71717a"
                            />

                            <TouchableOpacity 
                                onPress={handleBid}
                                className="bg-emerald-500 py-3 rounded-xl items-center shadow-lg shadow-emerald-500/30"
                            >
                                <Text className="text-white font-black text-lg">PLACE BID</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
